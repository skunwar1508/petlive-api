const express = require('express');
const dashboardController = require('../../controllers/dashboard/dashboard.controller.js');
const verifyJWT = require('../../utils/jwt');

const router = express.Router();

router.get('/doctor', verifyJWT, dashboardController.getDoctorDashboard);

module.exports = router;