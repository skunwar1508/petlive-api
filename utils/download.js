const router = require('express').Router();
const CMS = require("../common-modules/index");

const tinify = require("tinify");

tinify.key = process.env.TINIFY_KEY;

/**
 * @function  download_File
 * @description API Will be /api/v1/media/upload  
 * @example Upload_File
 */

router.get('/:imageId', async function (req, res) {
    try {
      let imageId = req.params.imageId; 
      let image= await CMS.Media_Center.getImage(imageId)
      if(image){
        return res.status(200).json({
          message: CMS.Lang_Messages('en', 'downloaded'),
          "data": image,
        });
  
      } else{
        return res.status(400).json({
          message: CMS.Lang_Messages('en', 'notFound'),
        });
  
      }
  
    } catch (error) {
      console.error(error.message);
      return res.status(400).json({
        message: CMS.Lang_Messages('en', 'serverError'),
      });
    }
  })



module.exports = router;

