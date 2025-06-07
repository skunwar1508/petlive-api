const mongoose = require('mongoose');

const HelpdeskTicketSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    description: {
        type: String,
        trim: true
    },
    attachment: {
        type: String,
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'pending'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HelpdeskTicket', HelpdeskTicketSchema);