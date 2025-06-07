const Media = require('../../models/image.model'); // Adjust the path as needed
const apiResponses = require('../../utils/apiResponse'); // Adjust the path as needed
const CMS = require('../../common-modules/index'); // Adjust the path as needed

// Controller to get an image by ID
const getImageById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the image by ID in the database
        const image = await Media.findById({
            _id: id,
        })

        if (!image) {
            return apiResponses.errorMessage(res, 400, CMS.Lang_Messages("en", "notF"));
        }

        // Send the image data as a response
        return apiResponses.successResponse(res, CMS.Lang_Messages("en", "success"), image);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
};

module.exports = {
    getImageById,
};