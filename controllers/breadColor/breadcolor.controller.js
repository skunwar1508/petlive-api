const breadColor = require('../../models/bread.colors.model');
const roles = require('../../utils/roles');
const CMS = require('../../common-modules/index');
const apiResponse = require('../../utils/apiResponse');
const breadColorController = {
    async getAll(req, res) {
        try {
            let filter = {};
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const categories = await breadColor.find(filter);
            return apiResponse.successResponse(
                res,
                CMS.Lang_Messages("en", "success"),
                categories
            );
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
            const cat = await breadColor.findOne(filter);
            if (!cat) {
                return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            }
            return apiResponse.successResponse(
                res,
                CMS.Lang_Messages("en", "success"),
                cat
            );
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async create(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const newbreadColor = new breadColor(req.body);
            const savedbreadColor = await newbreadColor.save();
            return apiResponse.successResponse(
                res,
                CMS.Lang_Messages("en", "success"),
                savedbreadColor
            );
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async update(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const updatedbreadColor = await breadColor.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!updatedbreadColor) {
                return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            }
            return apiResponse.successResponse(
                res,
                CMS.Lang_Messages("en", "success"),
                updatedbreadColor
            );
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async delete(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const deletedbreadColor = await breadColor.findByIdAndDelete(req.params.id);
            if (!deletedbreadColor) {
                return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            }
            return apiResponse.successResponse(
                res,
                CMS.Lang_Messages("en", "deleted"),
                { message: 'breadColor deleted successfully' }
            );
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    paginate: async (req, res) => {
        try {
            const { page = 1, perPage = 10, searchString } = req.body;
            let filter = {};
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            if (searchString) {
                filter.name = { $regex: searchString, $options: 'i' };
            }
            const skip = (parseInt(page) - 1) * parseInt(perPage);
            const [categories, total] = await Promise.all([
                breadColor.find(filter).skip(skip).limit(parseInt(perPage)),
                breadColor.countDocuments(filter)
            ]);
            return apiResponse.successResWithPagination(
                res,
                CMS.Lang_Messages("en", "success"),
                categories,
                total
            );
        } catch (error) {
            return apiResponse.errorMessage(res, 500, error.message);
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
            const updatedbreadColor = await breadColor.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true, runValidators: true }
            );
            if (!updatedbreadColor) {
                return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "categorynotfound"));
            }
            return apiResponse.successResponse(
                res,
                CMS.Lang_Messages("en", "updated"),
                updatedbreadColor
            );
        } catch (error) {
            return apiResponse.errorMessage(res, 400, error.message);
        }
    }
};

module.exports = breadColorController;