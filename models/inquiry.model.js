const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
    type: { type: String },
    petName: { type: String, },
    email: { type: String },
    phone: { type: String },
    preferredContactMethod: { type: String },
    issue: { type: String }
});

module.exports = mongoose.model('Inquiry', contactUsSchema);
