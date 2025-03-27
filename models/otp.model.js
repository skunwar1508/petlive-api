const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @module OTP_Schema
 */

/**
 * @typedef {Object} Otp
 * @property {Object} userId - id of the user
 * @property {number} otp - The random numbers that generated for the user
 * @property {string} email - Primary email of the user
 * @property {string} phone - Primary Mobile No of the user
 * @property {string} usedFor - Otp usedFor like to verify phone Number or forgot password etc.
 * @property {Date} expired - Expiration Date of the otp which is 10 minutes
 *
 */

const OtpSchema = new Schema({
    userId: { type: Schema.Types.ObjectId },
    otp: { type: Number },
    email: { type: String },
    phone: { type: String },
    usedFor: { type: String },
    expired: { type: Date, default: Date.now, index: { expires: '10m' } },
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
})

module.exports = mongoose.model('Otp', OtpSchema);

