const express = require('express');
const verifyJWT = require('../../utils/jwt.js');
const router = express.Router();

// Import your chat controllers
const {
    getAllMessages,
    chatroomPagin,
    isBookingOpen
} = require('../../controllers/socket/socket.controller.js'); // Adjust path as needed

// Get all messages (query params: patientId, doctorId)
router.get('/messages', verifyJWT, (req, res) => getAllMessages(req.query, res));

// Chatroom pagination
router.post('/chatroom/pagination', verifyJWT, chatroomPagin);

// Check if booking (chatroom) is open
router.get('/chatroom/isBookingOpen/:serviceId', verifyJWT, isBookingOpen);

module.exports = router;
