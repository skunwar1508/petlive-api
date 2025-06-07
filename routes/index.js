const express = require('express');

const adminRouter = require('./admin/admin.index.js');
const doctorRouter = require('./doctor/doctor.index.js');
const patientRouter = require('./patient/patient.index.js');

const router = express.Router();

router.use('/admin', adminRouter);
router.use('/doctor', doctorRouter);
router.use('/patient', patientRouter);

router.use("/media", require("./media/media.download.route.js"));
router.use("/category", require("./category/category.index.js"));

module.exports = router;