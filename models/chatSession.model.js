const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom'},
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    doctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'pet' },
    requestedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    endedAt: { type: Date },
    servicePrice : { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'started', 'ended'],
        default: 'pending',
    },
    totalMinutes: Number,
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
