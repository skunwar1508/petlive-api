const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    time: {
        type: Number,
    },
    description: {
        type: String,
    },
    image: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', default: "303030303030303030303030" },
    price: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('Service', serviceSchema);