const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'patient', // ✅ use 'patient' as the referenced model
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        // required: true,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null, // Allow serviceId to be optional
    },
    chatRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        default: null, // Allow chatRequestId to be optional
    },
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    lastMessage: {
        type: String,
        default: '',
    },
    lastMessageAt: {
        type: Date,
        default: null,
    },
    isClosed: {
        type: Boolean,
        default: false,
    },
    isRated: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
    },
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
