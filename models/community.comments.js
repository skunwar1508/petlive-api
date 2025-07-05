const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * @typedef {Object} community_comment_reply
*/

/**
 * @module community_comment_reply
 * @property {string} communityObjId - The Object ID of the Community, on which community this (comment, msg) is given.
 * @property {string} senderId - Sender Id of this (message, reply) that may be (patient or doctor)
 * @property {string} senderRole - Role of Sender (Patient, Doctor).
 * @property {string} comment - comment on community.
 * @property {string} replies - reply array on community with details (senderId, senderRole, reply).
 */

const communityCommentReplySchema = new Schema(
    {
        communityPostObjId: { type: Schema.Types.ObjectId, ref: "CommunityPost" },
        senderId: { type: mongoose.Schema.Types.ObjectId, refPath: "senderRole" },
        senderRole: { type: String, enum: ["patient", "doctor"] },
        comment: { type: String, required: true },
        replies: [
            {
                reply: { type: String, required: true },
                doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", default: null },
                patientId: { type: mongoose.Schema.Types.ObjectId, ref: "patient", default: null },
                role: { type: String, enum: ["patient", "doctor"] },
                createdAt: { type: Date, default: Date.now } // Explicitly define timestamp
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model("community_comment_reply", communityCommentReplySchema);
