const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'pet', // ✅ use 'pet' as the referenced model
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        // required: true,
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
    isOpen: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
