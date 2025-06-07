const mongoose = require('mongoose');

const HelpdeskChatSchema = new mongoose.Schema({
    userRole: {
        type: String,
        enum: ['Pet', 'Doctor'],
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userRole', // Dynamically reference model based on userRole
        required: true,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false,
    },
    message: {
        type: String,
        required: true,
    },
    attachment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image', // Assuming you have an Image model for attachments
        default: null, // Optional attachment field
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('HelpdeskChat', HelpdeskChatSchema);