const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'pet', required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    totalMinutes: Number,
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
