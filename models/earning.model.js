const mongoose = require('mongoose');

const doctorEarningsSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, required: true }, // Unique order ID
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'patient' },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
    amount: { type: Number, required: true },
    commission: { type: Number, required: true },
    settled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DoctorEarnings', doctorEarningsSchema);