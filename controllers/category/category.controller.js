const category = require('../../models/category.model');
const roles = require('../../utils/roles');
const CMS = require('../../common-modules/index');
const apiResponse = require('../../utils/apiResponse');

const categoryController = {
    async getPaginatedCategories(req, res) {
        try {
            let { page = 1, perPage = 10, searchString = "", ...filters } = req.body;
            page = parseInt(page);
            perPage = parseInt(perPage);

            // If user is patient or doctor, filter by status: true
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filters.status = true;
            }

            // If searchString is provided, add a case-insensitive search on name
            if (searchString && typeof searchString === "string" && searchString.trim() !== "") {
                filters.name = { $regex: searchString.trim(), $options: "i" };
            }

            const skip = (page - 1) * perPage;
            const [categories, total] = await Promise.all([
                category.find(filters).skip(skip).limit(perPage),
                category.countDocuments(filters)
            ]);

            return apiResponse.successResponseWithData(res, "Paginated categories", {
                categories,
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage)
            });
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },
    async getAll(req, res) {
        try {
            // If user is patient or doctor, filter by status: true
            let filter = {};
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const categories = await category.find(filter);
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), categories);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async getOne(req, res) {
        try {
            let filter = { _id: req.params.id };
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const cat = await category.findOne(filter);
            if (!cat) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            return apiResponse.successResponse(res, cat);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async create(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const newCategory = new category(req.body);
            const savedCategory = await newCategory.save();
            return apiResponse.successResponseWithData(res, "Category created", savedCategory);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async update(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const updatedCategory = await category.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!updatedCategory) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            return apiResponse.successResponseWithData(res, "Category updated", updatedCategory);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async delete(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const deletedCategory = await category.findByIdAndDelete(req.params.id);
            if (!deletedCategory) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "categorydeleted"));
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    }
};

module.exports = categoryController;