const express = require('express');

const authController = require('../../controllers/patient/auth');

const patientValidation = require('../../middleware/patient.validation');
const verifyJWT = require('../../utils/jwt');

const router = express.Router();

router.post('/login', patientValidation.loginValidation, authController.login);
router.post('/verifyOtp', patientValidation.verifyOtpValidation, authController.verifyOtp);
router.post('/signup', patientValidation.signupValidation, authController.signup);
router.post('/sendOtp', patientValidation.sendOtpValidation, authController.sendOtp);
router.post('/verifySignUpOTP', patientValidation.verifyOtpSignupValidation, authController.verifySignUpOTP);
router.get('/refreshToken', verifyJWT, authController.refreshToken);

module.exports = router;