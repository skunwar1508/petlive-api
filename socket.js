// Required modules
const jwt = require("jsonwebtoken");
const { userJoin, getCurrentUser, removeUser } = require("./utils/users");
const Message = require("./models/chat.model");
const ChatRoom = require("./models/chatRoom.model");
const ChatSession = require("./models/chatSession.model");
const Pet = require("./models/patient.model");
const Doctor = require('./models/doctor.model');

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

        // Patient initiates chat request
        // Patient initiates chat request
        socket.on("chatRequest", async ({ doctorId }) => {
            if (socket.doc.role !== "patient") {
                return socket.emit("chatError", "Only patients can request chat");
            }
            if (!doctorId) {
                return socket.emit("chatError", "Doctor ID is required");
            }

            // Check if doctor exists
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return socket.emit("chatError", "Doctor not found");
            }

            // Save chat request in a separate collection
            let chatRequest = await ChatSession.create({
                doctorId,
                patientId: socket.doc.id,
                status: "pending",
                requestedAt: new Date(),
            });

            // Notify doctor of chat request
            io.emit(`chatRequest:${doctorId}`, {
                patientId: socket.doc.id,
                patientSocketId: socket.id,
                doctorId,
                chatRequestId: chatRequest._id,
            });

            socket.emit("chatRequestSent", { doctorId, chatRequestId: chatRequest._id });
        });

        // Doctor accepts chat request (but does not join chat yet)
        socket.on("acceptChatRequest", async ({ patientId, chatRequestId }) => {
            if (socket.doc.role !== "doctor") {
                return socket.emit("chatError", "Only doctors can accept chat requests");
            }
            if (!patientId || !chatRequestId) {
                return socket.emit("chatError", "Patient ID and chatRequestId are required");
            }

            // Find the chat request and check status
            const chatRequest = await ChatSession.findById(chatRequestId);
            if (!chatRequest) {
                return socket.emit("chatError", "Chat request not found");
            }
            if (chatRequest.status !== "pending") {
                return socket.emit("chatError", "Only pending requests can be accepted");
            }

            // Update chat request status
            await ChatSession.findByIdAndUpdate(chatRequestId, { status: "accepted", acceptedAt: new Date() });

            // Find or create chat room
            let con = { patientId, doctorId: socket.doc.id };
            let chatRoom = await ChatRoom.findOne(con);
            if (!chatRoom) {
                const totalRooms = await ChatRoom.countDocuments();
                con.roomId = `ROOM-${totalRooms + 1}`;
                chatRoom = new ChatRoom(con);
                await chatRoom.save();
            }

            // Do NOT join doctor to room here

            // Notify patient to join chat
            io.emit(`chatAccepted:${patientId}`, { chatRoomId: chatRoom._id, doctorId: socket.doc.id, chatRequestId });

            socket.emit("chatAccepted", { chatRoomId: chatRoom._id, chatRequestId });
        });

        // Doctor rejects chat request
        socket.on("rejectChatRequest", async ({ patientId, chatRequestId }) => {
            if (socket.doc.role !== "doctor") {
                return socket.emit("chatError", "Only doctors can reject chat requests");
            }
            if (!patientId || !chatRequestId) {
                return socket.emit("chatError", "Patient ID and chatRequestId are required");
            }

            // Find the chat request and check status
            const chatRequest = await ChatSession.findById(chatRequestId);
            if (!chatRequest) {
                return socket.emit("chatError", "Chat request not found");
            }
            if (chatRequest.status !== "pending") {
                return socket.emit("chatError", "Only pending requests can be rejected");
            }

            // Update chat request status
            await ChatSession.findByIdAndUpdate(chatRequestId, { status: "rejected", rejectedAt: new Date() });

            // Notify patient of rejection
            io.emit(`chatRejected:${patientId}`, { doctorId: socket.doc.id, chatRequestId });
        });

        // Patient or doctor joins chat after acceptance
        socket.on("joinChat", async ({ chatRoomId, chatRequestId }) => {
            if (!chatRoomId) {
                return socket.emit("chatError", "Chat Room ID is required");
            }

            const type = socket.doc.role;
            let chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return socket.emit("chatError", "Chat Room Not Found");
            }

            // If doctor, check if request status is accepted
            if (type === "doctor") {
                if (!chatRequestId) {
                    return socket.emit("chatError", "Chat Request ID is required");
                }
                const chatRequest = await ChatSession.findById(chatRequestId);
                if (!chatRequest || chatRequest.status !== "accepted") {
                    return socket.emit("chatError", "Chat request is not accepted");
                }
            }

            const user = userJoin(socket.id, socket.doc.id, chatRoom._id.toString());
            if (!user) return socket.emit("chatError", "Authorization Failed");

            socket.join(user.room);
            console.log(`${socket.doc.id} joined chat ${user.room}`);

            if (type === "patient") {
                const pet = await Pet.findById(socket.doc.id);
                const doctor = await Doctor.findById(chatRoom.doctorId);
                if (!doctor) {
                    return socket.emit("chatError", { message: "Doctor not found" });
                }

                const feePerMinute = doctor.consultationFee || 1;
                const requiredBalance = feePerMinute * 3; // 3 minutes minimum
                if (!pet || pet.walletBalance < requiredBalance) {
                    return socket.emit("chatError", { message: "Minimum 3-minute balance required" });
                }

                // Deduct initial 3 minutes
                pet.walletBalance -= requiredBalance;
                await pet.save();

                // Start chat session and deduction interval
                const sessionStart = new Date();
                socket.sessionStart = sessionStart;

                // Update chat request status to started
                if (chatRequestId) {
                    await ChatSession.findByIdAndUpdate(chatRequestId, { status: "started", startedAt: sessionStart });
                }

                const interval = setInterval(async () => {
                    const current = await Pet.findById(socket.doc.id);
                    if (!current || current.walletBalance < feePerMinute) {
                        clearInterval(interval);
                        io.to(user.room).emit("chatEnded", { reason: "Wallet balance exhausted" });
                        // Update chat session as ended
                        if (chatRequestId) {
                            const sessionEnd = new Date();
                            const duration = Math.ceil((sessionEnd - socket.sessionStart) / 60000);
                            await ChatSession.findByIdAndUpdate(chatRequestId, {
                                status: "ended",
                                endedAt: sessionEnd,
                                totalMinutes: duration,
                                totalAmount: duration * feePerMinute,
                            });
                        }
                        return;
                    }
                    current.walletBalance -= feePerMinute;
                    await current.save();
                    io.to(user.room).emit("walletUpdate", { walletBalance: current.walletBalance });

                    if (current.walletBalance < feePerMinute) {
                        clearInterval(interval);
                        io.to(user.room).emit("chatEnded", { reason: "Wallet balance exhausted" });
                        // Update chat session as ended
                        if (chatRequestId) {
                            const sessionEnd = new Date();
                            const duration = Math.ceil((sessionEnd - socket.sessionStart) / 60000);
                            await ChatSession.findByIdAndUpdate(chatRequestId, {
                                status: "ended",
                                endedAt: sessionEnd,
                                totalMinutes: duration,
                                totalAmount: duration * feePerMinute,
                            });
                        }
                    }
                }, 60000);

                timers.set(user.room, interval);
            }

            io.to(user.id).emit("recentMessages", { data: chatRoom, messages: "successfully joined" });
        });

        // When chat ends, update session with total minutes and amount
        socket.on("leaveChat", async () => {
            const user = getCurrentUser(socket.id);
            if (!user) return;

            const chatRoom = await ChatRoom.findById(user.room);
            if (!chatRoom) return;

            // If doctor, check if chat session status is "started"
            if (socket.doc.role === "doctor") {
                // Find the latest chat session for this room
                const session = await ChatSession.findOne({
                    chatRoom: chatRoom._id,
                    doctorId: chatRoom.doctorId,
                    patientId: chatRoom.patientId,
                }).sort({ startedAt: -1 });

                if (!session || session.status !== "started") {
                    return socket.emit("chatError", "Doctor can only leave if chat is started");
                }
            }

            const interval = timers.get(user.room);
            if (interval) clearInterval(interval);
            timers.delete(user.room);

            if (socket.sessionStart) {
                const sessionEnd = new Date();
                const duration = Math.ceil((sessionEnd - socket.sessionStart) / 60000);

                // Find the latest chat session for this room and update
                const session = await ChatSession.findOne({
                    chatRoom: chatRoom._id,
                    doctorId: chatRoom.doctorId,
                    patientId: chatRoom.patientId,
                }).sort({ startedAt: -1 });

                let feePerMinute = 1;
                const doctor = await Doctor.findById(chatRoom.doctorId);
                if (doctor && doctor.consultationFee) {
                    feePerMinute = doctor.consultationFee;
                }

                if (session) {
                    session.endedAt = sessionEnd;
                    session.totalMinutes = duration;
                    session.totalAmount = duration * feePerMinute;
                    session.status = "ended";
                    await session.save();
                } else {
                    await ChatSession.create({
                        chatRoom: chatRoom._id,
                        doctorId: chatRoom.doctorId,
                        patientId: chatRoom.patientId,
                        startedAt: socket.sessionStart,
                        endedAt: sessionEnd,
                        totalMinutes: duration,
                        totalAmount: duration * feePerMinute,
                        status: "ended",
                    });
                }
            }

            io.to(user.room).emit("leftChat", { message: "Chat ended" });
            socket.leave(user.room);
            removeUser(socket.doc.id);

            // If patient leaves, also disconnect doctor from the room
            if (socket.doc.role === "patient" || socket.doc.role === "doctor") {
                // Find all sockets in the room
                const socketsInRoom = await io.in(user.room).fetchSockets();
                for (const s of socketsInRoom) {
                    if (
                        (socket.doc.role === "patient" && s.doc && s.doc.role === "doctor") ||
                        (socket.doc.role === "doctor" && s.doc && s.doc.role === "patient")
                    ) {
                        s.leave(user.room);
                        removeUser(s.doc.id);
                        s.emit("leftChat", { message: `Chat ended by ${socket.doc.role}` });
                    }
                }
            }
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
