const doctorModel = require('../../models/doctor.model');
const apiResponse = require('../../utils/apiResponse');
const CMS = require('../../common-modules/index');

const updateRecommended = async (req, res) => {
    try {
        const { doctorId, recommended } = req.body;

        // Find the doctor by ID
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "usernotfound"));
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

module.exports = {
    updateRecommended
}