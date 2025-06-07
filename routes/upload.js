const express = require('express');
const router = express.Router();
let multer = require('multer');
const upload = multer()

router.use("/upload", upload.single('coverImage'), require("../utils/upload.js"));
// router.use("/download", require("../utils/download.js"));

module.exports = router;