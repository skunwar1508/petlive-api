const express = require('express');
const verifyJWT = require('../../utils/jwt.js');
const router = express.Router();

// Import your chat controllers
const {
    getAllMessages,
    chatroomPagin,
    isBookingOpen,
    chatroomById,
    getAllChatSessions
} = require('../../controllers/socket/socket.controller.js'); // Adjust path as needed

// Get all messages (query params: patientId, doctorId)
router.get('/messages/:id', verifyJWT, getAllMessages);

// Chatroom pagination
router.post('/chatroom/pagination', verifyJWT, chatroomPagin);
// Get chatroom by _id
router.get('/chatroom/:id', verifyJWT, chatroomById);

// Check if booking (chatroom) is open
router.get('/chatroom/isBookingOpen/:serviceId', verifyJWT, isBookingOpen);

router.get('/chatsessions', verifyJWT, getAllChatSessions);

module.exports = router;
