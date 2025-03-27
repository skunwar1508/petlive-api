const express = require('express');

const adminRouter = require('./admin/admin.index.js');
const doctorRouter = require('./doctor/doctor.index.js');
const patientRouter = require('./patient/patient.index.js');

const router = express.Router();

router.use('/admin', adminRouter);
router.use('/doctor', doctorRouter);
router.use('/patient', patientRouter);
module.exports = router;