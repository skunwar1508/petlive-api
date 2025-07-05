const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @typedef {Object} community_flag
 */

/**
 * @module community_flag
 * @property {string} reason - The reason for flagging the community or post.
 * @property {string} communityId - The Object ID of the Community being flagged.
 * @property {string} communityPostId - The Object ID of the Community Post being flagged.
 * @property {string} flaggedBy - The Object ID of the user who flagged the content.
 * @property {string} flaggedByRole - Role of the user who flagged the content (Patient, Doctor).
 */

const communityFlagSchema = new Schema(
    {
        reason: { type: String, required: true },
        communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
        communityPostId: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true },
        flaggedBy: { type: Schema.Types.ObjectId, refPath: "flaggedByRole", required: true },
        flaggedByRole: { type: String, enum: ["patient", "doctor"], required: true },
        createdAt: { type: Date, default: Date.now } // Explicitly define timestamp
    },
    { timestamps: true }
);

module.exports = mongoose.model("community_flag", communityFlagSchema);