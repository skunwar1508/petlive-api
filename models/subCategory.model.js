const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('SubCategory', subCategorySchema);