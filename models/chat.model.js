const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet', // ✅ changed to 'Pet'
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    senderType: {
        type: String,
        enum: ['patient', 'doctor'],
        required: true,
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true,
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
    seenAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
