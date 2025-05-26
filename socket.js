// Required modules
const jwt = require("jsonwebtoken");
const { userJoin, getCurrentUser, removeUser } = require("./utils/users");
const Message = require("./models/chat.model");
const ChatRoom = require("./models/chatRoom.model");
const ChatSession = require("./models/chatSession.model");
const Pet = require("./models/patient.model");

const timers = new Map();

module.exports = function (io) {
    io.use(function (socket, next) {
        try {
            if (socket.handshake.query && socket.handshake.query.token) {
                const token = socket.handshake.query.token;

                jwt.verify(token, process.env.LOGIN_KEY, function (err, _) {
                    if (err) {
                        console.log(err);
                        return next(new Error('Fail to authenticate token.'));
                    } else {
                        let decoded = jwt.decode(token, { complete: true });
                        socket.doc = decoded.payload;
                        const userType = socket.handshake.query.type;
                        console.log("User Type:", userType);
                        if (userType === "doctor" || userType === "patient" || userType === "admin") {
                            socket.doc.role = userType;
                            next();
                        } else {
                            next(new Error('Invalid user type'));
                        }
                    }
                });
            } else {
                next(new Error('Authentication error'));
            }
        } catch (err) {
            console.log(err);
            next(new Error('Internal server error'));
        }
    });

    io.on("connection", (socket) => {
        socket.on("joinChat", async ({ id }) => {
            const type = socket.doc.role;
            let con = {};

            if (type === "patient") {
                con.patientId = socket.doc.id;
                con.doctorId = id;
            } else if (type === "doctor") {
                con.patientId = id;
                con.doctorId = socket.doc.id;
            }

            let chatRoom = await ChatRoom.findOne(con);
            if (!chatRoom) {
                const totalRooms = await ChatRoom.countDocuments();
                con.roomId = `ROOM-${totalRooms + 1}`;
                chatRoom = new ChatRoom(con);
                await chatRoom.save();
            }

            const user = userJoin(socket.id, socket.doc.id, chatRoom._id.toString());
            if (!user) return socket.emit("chatError", "Authorization Failed");

            socket.join(user.room);
            console.log(`${socket.doc.id} joined chat ${user.room}`);

            if (type === "patient") {
                const pet = await Pet.findById(socket.doc.id);
                console.log("Pet Wallet Balance:", socket.doc.id);
                if (!pet || pet.walletBalance < 3) {
                    return socket.emit("chatError", { message: "Minimum 3-minute balance required" });
                }

                // Deduct initial 3 minutes
                pet.walletBalance -= 3;
                await pet.save();

                // Start chat session and deduction interval
                const sessionStart = new Date();
                socket.sessionStart = sessionStart;

                const interval = setInterval(async () => {
                    const current = await Pet.findById(socket.doc.id);
                    if (!current || current.walletBalance <= 0) {
                        clearInterval(interval);
                        io.to(user.room).emit("chatEnded", { reason: "Wallet balance exhausted" });
                        return;
                    }
                    current.walletBalance -= 1;
                    await current.save();
                    io.to(user.room).emit("walletUpdate", { walletBalance: current.walletBalance });

                    if (current.walletBalance <= 0) {
                        clearInterval(interval);
                        io.to(user.room).emit("chatEnded", { reason: "Wallet balance exhausted" });
                    }
                }, 60000);

                timers.set(user.room, interval);
            }

            io.to(user.id).emit("recentMessages", { data: chatRoom, messages: "successfully joined" });
        });

        socket.on("chatMessage", async ({ message }) => {
            const user = getCurrentUser(socket.id);
            if (!user) return socket.emit("chatError", "Authorization Failed");

            const chatRoom = await ChatRoom.findById(user.room);
            if (!chatRoom) return socket.emit("chatError", "Chat Room Not Found");

            const messageData = {
                doctorId: chatRoom.doctorId,
                message,
                patientId: chatRoom.patientId,
                senderType: socket.doc.role,
                chatRoom: chatRoom._id,
            };

            let newMessage = new Message(messageData);
            await newMessage.save();

            chatRoom.lastMessage = message;
            chatRoom.lastMessageAt = new Date();
            await chatRoom.save();

            io.to(user.room).emit("message", newMessage);
        });

        socket.on("leaveChat", async () => {
            const user = getCurrentUser(socket.id);
            if (!user) return;

            const chatRoom = await ChatRoom.findById(user.room);
            if (!chatRoom) return;

            const interval = timers.get(user.room);
            if (interval) clearInterval(interval);
            timers.delete(user.room);

            if (socket.sessionStart) {
                const sessionEnd = new Date();
                const duration = Math.ceil((sessionEnd - socket.sessionStart) / 60000);

                await ChatSession.create({
                    chatRoom: chatRoom._id,
                    doctorId: chatRoom.doctorId,
                    patientId: chatRoom.patientId,
                    startedAt: socket.sessionStart,
                    endedAt: sessionEnd,
                    totalMinutes: duration,
                });
            }

            socket.leave(user.room);
            removeUser(socket.doc.id);
            io.to(user.room).emit("leftChat", { message: "Chat ended" });
        });

        socket.on("disconnect", () => {
            const user = getCurrentUser(socket.id);
            if (!user) return;

            const interval = timers.get(user.room);
            if (interval) clearInterval(interval);
            timers.delete(user.room);

            removeUser(socket.doc.id);
        });
    });
};
