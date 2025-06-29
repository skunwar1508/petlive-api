// Required modules
const jwt = require("jsonwebtoken");
const { userJoin, getCurrentUser, removeUser } = require("./utils/users");
const Message = require("./models/chat.model");
const ChatRoom = require("./models/chatRoom.model");
const ChatSession = require("./models/chatSession.model");
const Pet = require("./models/patient.model");
const Doctor = require('./models/doctor.model');
const Service = require('./models/service.model');

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
        // Patient initiates chat request for a service
        socket.on("chatRequest", async ({ serviceId }) => {
            if (socket.doc.role !== "patient") {
                return socket.emit("chatError", "Only patients can request chat");
            }
            if (!serviceId) {
                return socket.emit("chatError", "Service ID is required");
            }

            // Get patient and check wallet balance
            const pet = await Pet.findById(socket.doc.id);
            if (!pet) {
                return socket.emit("chatError", "Patient not found");
            }

            // Find doctors who provide this service (limit 10 random)
            const doctors = await Doctor.aggregate([
                { $match: { services: serviceId } },
                { $sample: { size: 10 } }
            ]);
            if (!doctors.length) {
                return socket.emit("chatError", "No doctors available for this service");
            }

            // Get consultation fee from Service collection
            const service = await Service.findById(serviceId);
            if (!service || typeof service.price !== "number") {
                return socket.emit("chatError", "Service or consultation fee not found");
            }
            const servicePrice = service.price;

            if (pet.walletBalance < servicePrice) {
                return socket.emit("chatError", { message: "Insufficient balance for this service" });
            }

            // Save chat request with status pending, and list of doctorIds
            let chatRequest = await ChatSession.create({
                serviceId,
                doctorIds: doctors.map(d => d._id),
                patientId: socket.doc.id,
                status: "pending",
                requestedAt: new Date(),
                servicePrice
            });
            console.log("Chat request created:", chatRequest);

            // Notify all 10 doctors of chat request
            for (const doc of doctors) {
                io.emit(`chatRequest:${doc._id}`, {
                    patientId: socket.doc.id,
                    patientSocketId: socket.id,
                    doctorId: doc._id,
                    chatRequestId: chatRequest._id,
                    serviceId,
                    servicePrice
                });
            }

            socket.emit("chatRequestSent", { doctorIds: doctors.map(d => d._id), chatRequestId: chatRequest._id, servicePrice });
        });

        // Doctor accepts chat request (only one doctor can accept)
        socket.on("acceptChatRequest", async ({ chatRequestId }) => {
            if (socket.doc.role !== "doctor") {
                return socket.emit("chatError", "Only doctors can accept chat requests");
            }
            if (!chatRequestId) {
                return socket.emit("chatError", "chatRequestId is required");
            }

            // Find the chat request and check status
            const chatRequest = await ChatSession.findById(chatRequestId);
            if (!chatRequest) {
                return socket.emit("chatError", "Chat request not found");
            }
            if (chatRequest.status !== "pending") {
                return socket.emit("chatError", "Request already accepted or rejected");
            }
            // Check if doctor is in the allowed list
            if (!chatRequest.doctorIds.map(id => id.toString()).includes(socket.doc.id.toString())) {
                return socket.emit("chatError", "You are not eligible for this request");
            }

            // Check patient wallet balance again before accept
            const pet = await Pet.findById(chatRequest.patientId);
            if (!pet || pet.walletBalance < chatRequest.servicePrice) {
                return socket.emit("chatError", { message: "Patient has insufficient balance" });
            }

            // Atomically update status to accepted if still pending
            const updated = await ChatSession.findOneAndUpdate(
                { _id: chatRequestId, status: "pending" },
                {
                    status: "accepted",
                    acceptedAt: new Date(),
                    doctorId: socket.doc.id
                },
                { new: true }
            );
            if (!updated || updated.status !== "accepted") {
                return socket.emit("chatError", "Request already accepted by another doctor");
            }

            // Deduct amount from patient wallet
            pet.walletBalance -= chatRequest.servicePrice;
            await pet.save();

            // Create chat room
            const totalRooms = await ChatRoom.countDocuments();
            const roomId = `ROOM-${totalRooms + 1}`;
            const chatRoom = new ChatRoom({
                patientId: chatRequest.patientId,
                doctorId: socket.doc.id,
                serviceId: chatRequest.serviceId,
                roomId
            });
            await chatRoom.save();

            // Link chatRoom to session
            updated.chatRoom = chatRoom._id;
            await updated.save();

            // Notify patient with doctor info and chatRoomId
            const doctorInfo = await Doctor.findById(socket.doc.id).select("-password");
            io.emit(`chatAccepted:${chatRequest.patientId}`, {
                chatRoomId: chatRoom._id,
                doctorId: socket.doc.id,
                chatRequestId,
                doctor: doctorInfo
            });

            socket.emit("chatAccepted", { chatRoomId: chatRoom._id, chatRequestId });

            // Notify other doctors that request is no longer available
            for (const docId of chatRequest.doctorIds) {
                if (docId.toString() !== socket.doc.id.toString()) {
                    io.emit(`chatRequestClosed:${docId}`, { chatRequestId });
                }
            }
        });

        // Doctor rejects chat request (others can still accept)
        socket.on("rejectChatRequest", async ({ chatRequestId }) => {
            if (socket.doc.role !== "doctor") {
                return socket.emit("chatError", "Only doctors can reject chat requests");
            }
            if (!chatRequestId) {
                return socket.emit("chatError", "chatRequestId is required");
            }

            // Find the chat request and check status
            const chatRequest = await ChatSession.findById(chatRequestId);
            if (!chatRequest) {
                return socket.emit("chatError", "Chat request not found");
            }
            if (chatRequest.status !== "pending") {
                return socket.emit("chatError", "Request already accepted or rejected");
            }

            // Remove doctor from eligible list
            await ChatSession.findByIdAndUpdate(chatRequestId, {
                $pull: { doctorIds: socket.doc.id }
            });

            // Notify patient if no more doctors left
            const updated = await ChatSession.findById(chatRequestId);
            if (updated.doctorIds.length === 0 && updated.status === "pending") {
                updated.status = "rejected";
                updated.rejectedAt = new Date();
                await updated.save();
                io.emit(`chatRejected:${updated.patientId}`, { chatRequestId });
            }
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

            // Only allow join if chat session is accepted
            const chatRequest = await ChatSession.findOne({ _id: chatRequestId, chatRoom: chatRoomId });
            if (!chatRequest || chatRequest.status !== "accepted") {
                return socket.emit("chatError", "Chat is not available to join");
            }

            // Prevent join if chat ended
            if (chatRequest.status === "ended") {
                return socket.emit("chatError", "Chat has ended");
            }

            const user = userJoin(socket.id, socket.doc.id, chatRoom._id.toString());
            if (!user) return socket.emit("chatError", "Authorization Failed");

            socket.join(user.room);
            console.log(`${socket.doc.id} joined chat ${user.room}`);

            io.to(user.id).emit("recentMessages", { data: chatRoom, messages: "successfully joined" });
        });

        // When chat ends, update session with total minutes and amount
        socket.on("leaveChat", async () => {
            const user = getCurrentUser(socket.id);
            if (!user) return;

            const chatRoom = await ChatRoom.findById(user.room);
            if (!chatRoom) return;

            // Find the chat session for this room
            const session = await ChatSession.findOne({
                chatRoom: chatRoom._id,
                doctorId: chatRoom.doctorId,
                patientId: chatRoom.patientId,
                status: "accepted"
            });

            if (!session) {
                return socket.emit("chatError", "No active chat session found");
            }

            // Only doctor can end the chat
            if (socket.doc.role !== "doctor") {
                return socket.emit("chatError", "Only doctor can end the chat");
            }

            // Mark session as ended
            session.status = "ended";
            session.endedAt = new Date();
            await session.save();

            io.to(user.room).emit("leftChat", { message: "Chat ended" });
            socket.leave(user.room);
            removeUser(socket.doc.id);

            // Disconnect all sockets in the room
            const socketsInRoom = await io.in(user.room).fetchSockets();
            for (const s of socketsInRoom) {
                s.leave(user.room);
                removeUser(s.doc.id);
                s.emit("leftChat", { message: `Chat ended by doctor` });
            }
        });

        // Only allow chat messages if chat is not ended
        socket.on("chatMessage", async ({ message, chatRequestId }) => {
            const user = getCurrentUser(socket.id);
            if (!user) return socket.emit("chatError", "Authorization Failed");

            const chatRoom = await ChatRoom.findById(user.room);
            if (!chatRoom) return socket.emit("chatError", "Chat Room Not Found");

            // Check if chat session is still active
            const session = await ChatSession.findOne({
                chatRoom: chatRoom._id,
                status: { $ne: "ended" }
            });
            if (!session) {
                return socket.emit("chatError", "Chat has ended");
            }

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
