const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const blogModel = require("../../models/blog.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { default: mongoose, sanitizeFilter } = require("mongoose");

const paginate = async (req, res) => {
    try {
        const { page = 1, perPage = 10, searchString = "", createdAt = -1 } = req.body;
        const skip = (page - 1) * perPage;

        const con = { isDeleted: false }; // Add any filtering conditions if needed
        if (!req.doc || req.doc.role !== roles.admin) {
            con.status = "published"; // Example condition for non-admin users
            con.isActive = true;
        }
        if (searchString) {
            con.title = { $regex: searchString, $options: "i" }; // Case-insensitive search
        }

        const [blogs, total] = await Promise.all([
            blogModel.find(con).skip(skip).limit(perPage).sort({ createdAt: createdAt }).populate('coverImage'),
            blogModel.countDocuments(con)
        ]);

        return apiResponse.successResWithPagination(res, CMS.Lang_Messages("en", "success"), blogs, total);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const create = async (req, res) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            coverImage: Joi.string().optional().allow(null, ''),
            published: Joi.boolean(),
            isActive: Joi.boolean(),
            categoryId: Joi.string().required(),
            isFeatured: Joi.boolean(),
            meta: Joi.object({
                title: Joi.string().optional().allow(null, '').default(''),
                description: Joi.string().optional().allow(null, '').default(''),
                keywords: Joi.string().optional().allow(null, '').default(''),
            }).optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            console.log(error?.details[0]?.message);
            return apiResponse.validationErrorWithData(res, "Validation Error: " + error?.details[0]?.message);
        }

        const sanitizedContent = sanitizeFilter(value.content);
        // Basic sanitization: remove script tags and trim whitespace
        // const sanitizedContent = value.content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();

        const blog = new blogModel({
            ...value,
            content: sanitizedContent,
            author: req.doc ? req.doc._id : null
        });

        await blog.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "created"), blog);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.validationErrorWithData(res, "Invalid blog ID");
        }
        // if (!req.doc || req.doc.role !== roles.admin) {
        //     return apiResponse.unauthorizedMsg(res, "Unauthorized");
        // }

        const schema = Joi.object({
            title: Joi.string().optional(),
            content: Joi.string().optional(),
            coverImage: Joi.string().optional().allow(null, ''),
            published: Joi.boolean().optional(),
            isActive: Joi.boolean().optional(),
            categoryId: Joi.string().required(),
            isFeatured: Joi.boolean().optional(),
            meta: Joi.object({
                title: Joi.string().optional().allow(null, '').default(''),
                description: Joi.string().optional().allow(null, '').default(''),
                keywords: Joi.string().optional().allow(null, '').default(''),
            }).optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return apiResponse.validationErrorWithData(res, "Validation Error: " + error?.details[0]?.message);
        }

        if (value.content) {
            value.content = sanitizeFilter(value.content);
        }

        const updatedBlog = await blogModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: value },
            { new: true }
        );

        if (!updatedBlog) {
            return apiResponse.notFoundResponse(res, "Blog not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "updated"), updatedBlog);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.validationErrorWithData(res, "Invalid blog ID");
        }
        const con = { _id: id, isDeleted: false };
        if (!req.doc || req.doc.role !== roles.admin) {
            con.status = "published";
            con.isActive = true;
        }

        const blog = await blogModel.findOne(con).populate('coverImage');
        if (!blog) {
            return apiResponse.notFoundResponse(res, "Blog not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), blog);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getTopFeatured = async (req, res) => {
    try {
        const con = { isDeleted: false, isFeatured: true, isActive: true, status: "published" };
        const blogs = await blogModel.find(con)
            .sort({ createdAt: -1 })
            .limit(4)
            .populate(['coverImage', 'author']);
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), blogs);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};


module.exports = {
    paginate,
    create,
    update,
    getById,
    getTopFeatured
};