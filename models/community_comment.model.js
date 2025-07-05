const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    userType: { type: String, enum: ['admin', 'doctor', 'patient'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true }, 
    content: { type: String, required: true },
    
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityComment', default: null }, // for nested replies

    
    createdAt: { type: Date, default: Date.now }
});

const CommunityComment = mongoose.model('CommunityComment', communityCommentSchema);

module.exports = CommunityComment;