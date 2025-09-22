const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        published: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date,
        },
        coverImage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Image',
        },
    },
    {
        timestamps: true,
    }
);

// Helper function to generate slug
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Pre-save hook to set slug
blogSchema.pre('validate', function (next) {
    if (this.title && (!this.slug || this.isModified('title'))) {
        this.slug = slugify(this.title);
    }
    next();
});

module.exports = mongoose.model('Blog', blogSchema);