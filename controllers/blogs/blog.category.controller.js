const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const blogCategoryModel = require("../../models/blog.category.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { default: mongoose, sanitizeFilter } = require("mongoose");

const paginate = async (req, res) => {
    try {
        const { page = 1, perPage = 10, searchString = "", createdAt = -1 } = req.body;
        const skip = (page - 1) * perPage;

        const con = { isDeleted: false };
        if (!req.doc || req.doc.role !== roles.admin) {
            con.isActive = true;
        }
        if (searchString) {
            con.name = { $regex: searchString, $options: "i" };
        }

        const [categories, total] = await Promise.all([
            blogCategoryModel.find(con).skip(skip).limit(perPage).sort({ createdAt: createdAt }),
            blogCategoryModel.countDocuments(con)
        ]);

        return apiResponse.successResWithPagination(res, CMS.Lang_Messages("en", "success"), categories, total);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getAll = async (req, res) => {
    try {
        const con = { isDeleted: false };
        if (!req.doc || req.doc.role !== roles.admin) {
            con.isActive = true;
        }

        const categories = await blogCategoryModel.find(con).sort({ createdAt: -1 });
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), categories);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.validationErrorWithData(res, "Invalid category ID");
        }

        const con = { _id: id, isDeleted: false };
        if (!req.doc || req.doc.role !== roles.admin) {
            con.isActive = true;
        }

        const category = await blogCategoryModel.findOne(con);
        if (!category) {
            return apiResponse.notFoundResponse(res, "Category not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), category);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const create = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            slug: Joi.string().optional().allow(null, ''),
            description: Joi.string().optional().allow(null, ''),
            isActive: Joi.boolean().optional(),
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

        // simple slug generation if not provided
        if (!value.slug && value.name) {
            value.slug = value.name.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        }

        // sanitize description if present
        if (value.description) {
            value.description = sanitizeFilter(value.description);
        }

        // check uniqueness by slug or name
        const exists = await blogCategoryModel.findOne({
            $or: [{ slug: value.slug }, { name: value.name }],
            isDeleted: false
        });
        if (exists) {
            return apiResponse.validationErrorWithData(res, "Category with same name or slug already exists");
        }

        const category = new blogCategoryModel({
            ...value,
            createdBy: req.doc ? req.doc._id : null
        });

        await category.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "created"), category);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.validationErrorWithData(res, "Invalid category ID");
        }

        const schema = Joi.object({
            name: Joi.string().required(),
            slug: Joi.string().optional().allow(null, ''),
            description: Joi.string().optional().allow(null, ''),
            isActive: Joi.boolean().optional(),
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

        // sanitize description if present
        if (value.description) {
            value.description = sanitizeFilter(value.description);
        }

        // if name provided and no slug, regenerate slug
        if (value.name && !value.slug) {
            value.slug = value.name.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        }

        // ensure uniqueness when changing name/slug
        if (value.name || value.slug) {
            const conflict = await blogCategoryModel.findOne({
                _id: { $ne: id },
                isDeleted: false,
                $or: (value.slug && value.name) ? [{ slug: value.slug }, { name: value.name }] :
                      value.slug ? [{ slug: value.slug }] : [{ name: value.name }]
            });
            if (conflict) {
                return apiResponse.validationErrorWithData(res, "Another category with same name or slug exists");
            }
        }

        const updated = await blogCategoryModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: value },
            { new: true }
        );
        if (!updated) {
            return apiResponse.notFoundResponse(res, "Category not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "updated"), updated);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const enableDisable = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.validationErrorWithData(res, "Invalid category ID");
        }
        if (typeof isActive !== "boolean") {
            return apiResponse.validationErrorWithData(res, "isActive must be a boolean");
        }

        const updated = await blogCategoryModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isActive } },
            { new: true }
        );
        if (!updated) {
            return apiResponse.notFoundResponse(res, "Category not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "updated"), updated);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return apiResponse.validationErrorWithData(res, "Invalid category ID");
        }

        const deleted = await blogCategoryModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true, isActive: false } },
            { new: true }
        );
        if (!deleted) {
            return apiResponse.notFoundResponse(res, "Category not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "deleted"), deleted);
    } catch (err) {
        console.log(err);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

module.exports = {
    paginate,
    getAll,
    getById,
    create,
    update,
    enableDisable,
    remove
};