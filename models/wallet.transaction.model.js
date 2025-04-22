const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    transactionId: { type: String, unique: true, required: true }, // Unique transaction ID
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor' },
    amount: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 }, // GST amount
    totalAmountPaid: { type: Number, default: 0 }, // Total amount paid including GST
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking'], required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    purpose: { type: String, enum: ['top-up', 'consultation'], required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    settled: { type: Boolean, default: false },
    settledAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

walletTransactionSchema.pre('validate', function(next) {
    if (!this.transactionId) {
        this.transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    next();
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);