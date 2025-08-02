const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the Doctor model
const doctorSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image', // Reference the Image model
        default: null,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    dob: {
        type: Date,
    },
    experience: {
        type: Number,
        min: 0, // Ensure experience is non-negative
    },
    registrationNo: {
        type: String,
    },
    licenceImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image', // Reference the Image model
    },
    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service', // Reference the Service model
    }],
    animalPreference: {
        type: [String]
    },
    primarySpecialisation: {
        type: String,
        trim: true,
    },
    otherSpecialisation: {
        type: String
    },
    recommended: {
        type: Boolean,
        default: false,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    bio: {
        type: String,
        trim: true,
        default: null,
    },
    approveProfile: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true, // Default to active
    },
    lastStep: {
        type: Number,
        default: 0,
        min: 0, // Ensure lastStep is non-negative
    },
    phone: { 
        type: String, 
        default: null, 
    },
    consultationFee : {
        type: Number,
        default: 0, // Default consultation fee
        min: 0, // Ensure consultation fee is non-negative
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true, // Prevent modification of createdAt
    },
},
{
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

// Export the Doctor model
module.exports = mongoose.model('doctor', doctorSchema);