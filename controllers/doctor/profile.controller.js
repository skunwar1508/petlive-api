const doctorModel = require('../../models/doctor.model');
const apiResponse = require('../../utils/apiResponse');
const CMS = require('../../common-modules/index');
const roles = require('../../utils/roles');

const updateRecommended = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 401, CMS.Lang_Messages("en", "unauthorized"));
        }

        const { doctorId, recommended } = req.body;

        // Find the doctor by ID
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }

        // Update the recommended key
        doctor.recommended = recommended;
        await doctor.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const updateOnlineStatus = async (req, res) => {
    try {
        // Check if user is doctor
        if (!req.doc || req.doc.role !== roles.doctor) {
            return apiResponse.errorMessage(res, 401, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        const { isOnline } = req.body;

        // Find the doctor by ID
        const doctor = await doctorModel.findById({
            _id: req.doc.id
        });
        if (!doctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }

        // Update the online status
        doctor.isOnline = isOnline;
        await doctor.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

module.exports = {
    updateRecommended,
    updateOnlineStatus
}