const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    phone: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
    ownerName: {
        type: String,
        trim: true,
    },
    ownerGender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    ownerDob: {
        type: Date,
    },
    ownerImage: [{
         type: mongoose.Schema.Types.ObjectId, ref: 'Image'
    }],
    name: {
        type: String,
        trim: true,
    },
    age: {
        type: String,
    },
    petType: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    interestFor: {
        type: String,
        trim: true,
    },
    reasonToFind: {
        type: String,
        trim: true,
    },
    weight: {
        type: Number,
    },
    breed: {
        type: String,
        trim: true,
    },
    color: {
        type: String,
        trim: true,
    },
    activityLevel: {
        type: String,
        trim: true,
    },
    dietaryPreference: {
        type: String,
        trim: true,
    },
    trainingBehaviour: {
        type: String,
        trim: true,
    },
    outdoorHabits: {
        type: String,
        trim: true,
    },
    petImages: {
        type: [String],
        default: [],
    },
    isAcceptTerms: {
        type: Boolean,
        default: false,
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
    lastStep: {
        type: Number,
        default: 0,
    },
    walletBalance: { type: Number, default: 0 },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Pet', petSchema);
