const subcategory = require('../../models/subCategory.model');
const roles = require('../../utils/roles');
const apiResponse = require('../../utils/apiResponse');
const CMS = require('../../common-modules/index'); // Assuming CMS is a utility for language messages

const subcategoryController = {
    getAll: async (req, res) => {
        try {
            let filter = { category: req.params.categoryId };
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const categories = await subcategory.find(filter);
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), categories);
        } catch (error) {
            console.log(error);
            return apiResponse.somethingWentWrongMsg(res);
        }
    },

    getOne: async (req, res) => {
        try {
            let filter = { _id: req.params.id };
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const cat = await subcategory.findOne(filter);
            if (!cat) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), cat);
        } catch (error) {
            console.log(error);
            return apiResponse.somethingWentWrongMsg(res);
        }
    },

    create: async (req, res) => {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const newCategory = new subcategory(req.body);
            const savedCategory = await newCategory.save();
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), savedCategory);
        } catch (error) {
            console.log(error);
            return apiResponse.errorMessage(res, 400, error.message);
        }
    },

    update: async (req, res) => {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const updatedCategory = await subcategory.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!updatedCategory) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "updated"), updatedCategory);
        } catch (error) {
            console.log(error);
            return apiResponse.errorMessage(res, 400, error.message);
        }
    },

    delete: async (req, res) => {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const deletedCategory = await subcategory.findByIdAndDelete(req.params.id);
            if (!deletedCategory) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "deleted"));
        } catch (error) {
            console.log(error);
            return apiResponse.somethingWentWrongMsg(res);
        }
    }
    ,
        paginate: async (req, res) => {
            try {
                const { page = 1, perPage = 10, categoryId, searchString } = req.body;
                let filter = {};
                if (
                    req.doc &&
                    (req.doc.role === roles.patient || req.doc.role === roles.doctor)
                ) {
                    filter.status = true;
                }
                if (categoryId) {
                    filter.category = categoryId;
                }
                if (searchString) {
                    filter.name = { $regex: searchString, $options: 'i' };
                }
                const skip = (parseInt(page) - 1) * parseInt(perPage);
                const [categories, total] = await Promise.all([
                    subcategory.find(filter).skip(skip).limit(parseInt(perPage)),
                    subcategory.countDocuments(filter)
                ]);
                return apiResponse.successResWithPagination(
                    res,
                    CMS.Lang_Messages("en", "success"),
                    categories,
                    total
                );
            } catch (error) {
                console.log(error);
                return apiResponse.somethingWentWrongMsg(res);
            }
        },

        updateStatus: async (req, res) => {
            if (!req.doc || req.doc.role !== roles.admin) {
                return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
            }
            try {
                const { status } = req.body;
                if (typeof status !== "boolean") {
                    return apiResponse.errorMessage(res, 400, "Invalid status value");
                }
                const updatedCategory = await subcategory.findByIdAndUpdate(
                    req.params.id,
                    { status },
                    { new: true, runValidators: true }
                );
                if (!updatedCategory) {
                    return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
                }
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "updated"), updatedCategory);
            } catch (error) {
                console.log(error);
                return apiResponse.errorMessage(res, 400, error.message);
            }
        }
};

module.exports = subcategoryController;