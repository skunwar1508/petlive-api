const express = require('express');

const authController = require('../../controllers/patient/auth');

const patientValidation = require('../../middleware/patient.validation');
const verifyJWT = require('../../utils/jwt');
const signupStepRouter = require('./steps/steps.index.js');

const router = express.Router();

router.post('/login', patientValidation.signUpValidation, authController.login);
router.post('/signup', patientValidation.signUpValidation, authController.signup);
router.post('/signup/verify', patientValidation.verifyOtpValidation,  authController.verifyOtp);
router.post('/signup/resend', patientValidation.resendValidation, authController.resendOtp);
router.get('/profile', verifyJWT, authController.getProfile);

// router.post('/verifyOtp', validation.verifyOtpValidation, authController.verifyOtp);
// router.post('/verifySignUpOTP', validation.verifyOtpSignupValidation, authController.verifySignUpOTP);
// router.post('/signup', validation.signupValidation, authController.signup);
// router.post('/sendOtp', validation.sendOtpValidation, authController.sendOtp);
// router.get('/refreshToken', verifyJWT, authController.refreshToken);

router.use('/signup/steps', verifyJWT, signupStepRouter);

module.exports = router;