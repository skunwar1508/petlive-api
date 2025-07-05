const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
    {
        content: {
            type: String,
        },
        image: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Image', // URL or path to image
        },
        authorRole: {
            type: String,
            enum: ['doctor', 'patient'],
            required: true,
        },
        communityId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Community',
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'authorRole', // reference to the user who created the post
            required: true,
        },

        likes: [{
            userType : { type: String, enum: ['Admin', 'doctor', 'patient'] },
            userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
        }],
        dislikes: [{
            userType : { type: String, enum: ['Admin', 'doctor', 'patient'] },
            userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
        }],
        reports: [{
            report : String,
            userType : { type: String, enum: ['Admin', 'doctor', 'patient'] },
            userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
        }],
        views: [{
            userType : { type: String, enum: ['Admin', 'doctor', 'patient'] },
            userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
        }],
        isEnabled:{
            type: Boolean,
            default: true,
        },
        isDeleted:{
            type: Boolean,
            default: false,
        },
        isAnonymouse:{
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

module.exports = CommunityPost;