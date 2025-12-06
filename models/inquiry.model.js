const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
    petType: { type: String },
    name: { type: String, },
    email: { type: String },
    phone: { type: String },
    preferredContactMethod: { type: String },
    issue: { type: String }
});

module.exports = mongoose.model('Inquiry', contactUsSchema);
