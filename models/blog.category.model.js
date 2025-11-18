const mongoose = require('mongoose');

const { Schema, model, models } = mongoose;

function slugify(text = '') {
    return text
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s\W-]+/g, '-') // collapse spaces and non-word chars to '-'
        .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

const BlogCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        meta: {
            title: { type: String, default: '' },
            description: { type: String, default: '' },
            keywords: { type: String, default: '' },
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure a slug based on name if not provided
BlogCategorySchema.pre('validate', async function (next) {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name);
    }

    // If slug already exists, try to make it unique by appending a counter
    if (this.isModified('slug')) {
        let base = this.slug;
        let suffix = 0;
        while (true) {
            const candidate = suffix === 0 ? base : `${base}-${suffix}`;
            const exists = await models.BlogCategory?.findOne({
                slug: candidate,
                _id: { $ne: this._id },
            }).lean();
            if (!exists) {
                this.slug = candidate;
                break;
            }
            suffix += 1;
            if (suffix > 1000) break;
        }
    }

    next();
});

module.exports = models.BlogCategory || model('BlogCategory', BlogCategorySchema);
