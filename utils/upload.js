const router = require('express').Router();
const CMS = require("../common-modules/index");
const apiResponse = require("../utils/apiResponse.js");

/**
 * @function  Upload_File
 * @description API Will be /api/v1/media/upload
 * @example Upload_File
 */

router.post('/', async (req, res) => {
    try {
        console.log({ req })
        console.log("uploading file ======>>>", req.file)
        let uploadData = req.file;
        let doc = await CMS.Media_Center.uploadMediaFiles(uploadData)

        return apiResponse.successResponse(res, "Uploaded", doc);
    } catch (error) {
        console.log(error);
        return apiResponse.errorMessage(res, 400, error);
    }
})



module.exports = router;

