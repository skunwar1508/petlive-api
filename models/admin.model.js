const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @module Admin_Schema
 */

/**
 * @typedef {Object} Admin
 * @property {string} name - Name of the user
 * @property {string} email - Email of the user
 * @property {string} password - Password of the user
 * @property {string} phone - Phone of the user
 * @property {string} profileImage - User image id
 * @property {string} role - Role of the user
 * @property {boolean} enabled - Status of user
 */

const AdminSchema = new Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String, select: false },
    phone: { type: String, },
    profileImage: { type: Schema.Types.ObjectId, ref: 'Image', default: "303030303030303030303030" },
    role: { type: String, },
    enabled: { type: Boolean, default: true },
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('Admin', AdminSchema);

