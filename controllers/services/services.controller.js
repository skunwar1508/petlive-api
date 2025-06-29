const Service = require('../../models/service.model');
const roles = require('../../utils/roles');
const CMS = require('../../common-modules/index');
const apiResponse = require('../../utils/apiResponse');

const serviceController = {
    async getAllServices(req, res) {
        try {
            // Example: filter by status for certain roles if needed
            let filter = {};
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const services = await Service.find(filter);
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), services);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async getServiceById(req, res) {
        try {
            let filter = { _id: req.params.id };
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const service = await Service.findOne(filter);
            if (!service) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "servicenotfound"));
            return apiResponse.successResponse(res, "Service retrieved", service);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async createService(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const newService = new Service(req.body);
            const savedService = await newService.save();
            return apiResponse.successResponseWithCreated(res, "Service created", savedService);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async updateService(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const updatedService = await Service.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!updatedService) return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "servicenotfound"));
            return apiResponse.successResponse(res, "Service updated", updatedService);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async servicePagination(req, res) {
        try {
            const { page = 1, perPage = 10 } = req.body;
            const skip = (parseInt(page) - 1) * parseInt(perPage);

            let filter = {};
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const [services, total] = await Promise.all([
                Service.find(filter).skip(skip).limit(parseInt(perPage)),
                Service.countDocuments(filter)
            ]);
            return apiResponse.successResWithPagination(res, "Paginated services", services, total);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    }
    ,
    async serviceStatusUpdate(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (typeof status !== "boolean") {
                return apiResponse.errorMessage(res, 400, "Invalid status value");
            }
            const updatedService = await Service.findByIdAndUpdate(
                id,
                { status },
                { new: true, runValidators: true }
            );
            if (!updatedService) {
                return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "servicenotfound"));
            }
            return apiResponse.successResponse(res, "Service status updated", updatedService);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    }
};

module.exports = serviceController;