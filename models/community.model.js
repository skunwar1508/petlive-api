const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: { type: mongoose.Schema.ObjectId, ref: "Image" }, // URL or path to image
  communityType: { type: String, enum: ['public', 'private'], default: 'public' },
  createdBy: { type: String, enum: ['Admin', 'doctor'], required: true },
  createdById: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdBy' },
  isEnabled: { type: Boolean, default: true },

  members: [{
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    joinedAt: { type: Date, default: Date.now },
    userType: { type: String, enum: ['doctor', 'patient'], required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;