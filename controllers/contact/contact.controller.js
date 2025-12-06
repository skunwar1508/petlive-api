const ContactUs = require('../../models/contact.model');
const CMS = require('../../common-modules/index');
const apiResponse = require('../../utils/apiResponse');
const roles = require('../../utils/roles');

const contactUsController = {
    async create(req, res) {
        try {
            const { name, email, subject, message } = req.body;
            if (!name || !email || !message) {
                return apiResponse.errorMessage(res, 400, "Name, email, and message are required.");
            }
            const newContact = new ContactUs({ name, email, subject, message });
            const savedContact = await newContact.save();
            return apiResponse.successResponse(res, "Contact message submitted", savedContact);
        } catch (err) {
            return apiResponse.errorMessage(res, 400, err.message);
        }
    },

    async getAll(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const contacts = await ContactUs.find().sort({ createdAt: -1 });
            return apiResponse.successResponse(res, "Contact messages fetched", contacts);
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },

    async getOne(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "accessdenied"));
        }
        try {
            const contact = await ContactUs.findById(req.params.id);
            if (!contact) {
                return apiResponse.errorMessage(res, 404, "Contact message not found");
            }
            return apiResponse.successResponse(res, "Contact message fetched", contact);
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

            const [contacts, total] = await Promise.all([
                ContactUs.find().sort({ createdAt: -1 }).skip(skip).limit(perPage),
                ContactUs.countDocuments()
            ]);

            return apiResponse.successResponse(res, "Contact messages fetched", {
                contacts,
                total,
                page,
                pages: Math.ceil(total / perPage)
            });
        } catch (err) {
            return apiResponse.errorMessage(res, 500, err.message);
        }
    },
};

module.exports = contactUsController;
