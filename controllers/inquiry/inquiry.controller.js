const Inquiry = require('../../models/inquiry.model');
const CMS = require('../../common-modules/index');
const apiResponse = require('../../utils/apiResponse');
const roles = require('../../utils/roles');

const inquiryController = {
    async create(req, res) {
        try {
            const { name, email, subject, petType, issue, phone, preferredContactMethod } = req.body;
            if (!name || !email || !issue) {
                return apiResponse.errorMessage(res, 400, "Name, email, and issue are required.");
            }
            const newInquiry = new Inquiry({ name, email, subject, petType, issue, phone, preferredContactMethod });
            const savedInquiry = await newInquiry.save();
            return apiResponse.successResponse(res, "Inquiry submitted", savedInquiry);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async getAll(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const inquiries = await Inquiry.find().sort({ createdAt: -1 });
            return apiResponse.successResponse(res, "Inquiries fetched", inquiries);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async getOne(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const inquiry = await Inquiry.findById(req.params.id);
            if (!inquiry) {
                return apiResponse.errorMessage(res, 404, "Inquiry not found");
            }
            return apiResponse.successResponse(res, "Inquiry fetched", inquiry);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async getPaginated(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const page = parseInt(req.body.page, 10) || 1;
            const perPage = parseInt(req.body.perPage, 10) || 10;
            const skip = (page - 1) * perPage;
            const searchString = req.body.searchString || '';

            // Build search query if searchString is provided
            let query = {};
            if (searchString) {
                const regex = new RegExp(searchString, 'i');
                query = {
                    $or: [
                        { petType: regex },
                        { name: regex },
                        { email: regex },
                        { phone: regex },
                    ]
                };
            }

            const [inquiries, total] = await Promise.all([
                Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage),
                Inquiry.countDocuments(query)
            ]);

            return apiResponse.successResponse(res, "Inquiries fetched", {
                inquiries,
                total,
                page,
                pages: Math.ceil(total / perPage)
            });
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },
};

module.exports = inquiryController;
