const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @module Image_Schema
 */

/**
 * @typedef {Object} Image
 * @property {String} name - name of the image
 * @property {String} size - size of the image
 * @property {String} type - type of the image
 * @property {String} encoding - encoding of the image
 * @property {String} user - user id of image
 * @property {String} path - path where image is saved
 * @property {String} fullUrl - Image URL
 */

const ImageSchema = new Schema({
    name: { type: String },
    size: { type: String },
    type: { type: String },
    encoding: { type: String },
    path: { type: String },
    fullUrl: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
    },
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = mongoose.model('Image', ImageSchema);

