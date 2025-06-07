const express = require('express');
const router = express.Router();
const verifyJWT = require('../../utils/jwt.js');
const { getImageById } = require('./media.controller.js');
let multer = require('multer');
const upload = multer()

router.get("/download/:id", verifyJWT, getImageById);
router.use("/upload", upload.single('coverImage'), require("../../utils/upload.js"));
router.use("/upload/multiple", upload.single('coverImage'), require("../../utils/upload.js"));

module.exports = router;



