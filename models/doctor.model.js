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
    animalPreference: {
        type: [String],
        default: [],
    },
    primarySpecialisation: {
        type: String,
        trim: true,
    },
    otherSpecialisation: {
        type: [String],
        default: [],
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
    lastStep: {
        type: Number,
        default: 0,
        min: 0, // Ensure lastStep is non-negative
    },
    phone: { 
        type: String, 
        default: null, 
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
module.exports = mongoose.model('Doctor', doctorSchema);