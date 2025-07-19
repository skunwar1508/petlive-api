const express = require('express');

const authController = require('../../controllers/doctor/auth');
const { updateRecommended, updateOnlineStatus } = require('../../controllers/doctor/profile.controller.js');

const validation = require('../../middleware/doctor.validation');
const verifyJWT = require('../../utils/jwt');
const signupStepRouter = require('./steps/steps.index.js');
const { recommendedValidation, onlineStatusValidation } = require('../../validations/admin/admin.doctor');

const router = express.Router();
console.log("authController", authController);

router.post('/login', validation.loginValidation, authController.login);
router.post('/signup', validation.signUpStepValidation, authController.signup);
router.post('/signup/verify', validation.signUpVerifyValidation, authController.verifySignUpOTP);
router.post('/signup/resend', validation.signUpResendValidation, authController.resendOTP);
router.get('/profile', verifyJWT, authController.getProfile);
router.post('/profile/consultation', verifyJWT, validation.consultationValidation, authController.consultationFeeUpdate);
router.post('/pagination', verifyJWT, validation.paginValidation, authController.pagination);
router.get('/details/:doctorId', verifyJWT, authController.getDoctorDetails);
router.put('/status/:doctorId', verifyJWT, authController.changeStatus);
router.put('/profileStatus/:doctorId', verifyJWT, authController.profileStatusUpdate);
router.post('/recommended/update', verifyJWT, recommendedValidation, updateRecommended);
router.post('/online/update/status', verifyJWT, onlineStatusValidation, updateOnlineStatus);
router.post('/profile/update', verifyJWT, validation.updateProfileValidation, authController.updateDoctorProfile);
router.post('/profile/update/:doctorId', verifyJWT, validation.updateProfileValidation, authController.updateDoctorProfile);
router.post('/create', verifyJWT, validation.updateProfileValidation, authController.doctorCreate);

// router.post('/verifyOtp', validation.verifyOtpValidation, authController.verifyOtp);
// router.post('/verifySignUpOTP', validation.verifyOtpSignupValidation, authController.verifySignUpOTP);
// router.post('/signup', validation.signupValidation, authController.signup);
// router.post('/sendOtp', validation.sendOtpValidation, authController.sendOtp);
// router.get('/refreshToken', verifyJWT, authController.refreshToken);

router.use('/signup/steps', verifyJWT, signupStepRouter);

module.exports = router;