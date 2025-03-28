const express = require('express');

const authController = require('../../controllers/doctor/auth');

const validation = require('../../middleware/doctor.validation');
const verifyJWT = require('../../utils/jwt');
const signupStepRouter = require('./steps/steps.index.js');

const router = express.Router();
console.log("authController", authController);

router.post('/login', validation.loginValidation, authController.login);
router.post('/signup', validation.signUpStepValidation, authController.signup);
router.post('/signup/verify', validation.signUpVerifyValidation, authController.verifySignUpOTP);
router.post('/signup/resend', validation.signUpResendValidation, authController.resendOTP);
router.get('/profile', verifyJWT, authController.getProfile);

// router.post('/verifyOtp', validation.verifyOtpValidation, authController.verifyOtp);
// router.post('/verifySignUpOTP', validation.verifyOtpSignupValidation, authController.verifySignUpOTP);
// router.post('/signup', validation.signupValidation, authController.signup);
// router.post('/sendOtp', validation.sendOtpValidation, authController.sendOtp);
// router.get('/refreshToken', verifyJWT, authController.refreshToken);

router.use('/signup/steps', verifyJWT, signupStepRouter);

module.exports = router;