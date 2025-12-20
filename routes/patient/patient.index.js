const express = require('express');

const authController = require('../../controllers/patient/auth');

const patientValidation = require('../../middleware/patient.validation');
const verifyJWT = require('../../utils/jwt');
const signupStepRouter = require('./steps/steps.index.js');
const wallet = require('./wallet/wallet.controller.js');

const router = express.Router();

router.post('/login', patientValidation.signUpValidation, authController.login);
router.post('/login/verify', patientValidation.verifyOtpValidation, authController.verifyLoginOtp);
router.post('/signup', patientValidation.signUpValidation, authController.signup);
router.post('/signup/verify', patientValidation.verifyOtpValidation,  authController.verifyOtp);
router.post('/web/signup', patientValidation.signUpWebValidation, authController.signupWeb);
router.post('/web/forget', patientValidation.verifyForgotWebValidation,  authController.forgetWeb);
router.post('/web/login', patientValidation.verifyOtpWebValidation,  authController.loginWeb);
router.post('/signup/resend', patientValidation.resendValidation, authController.resendOtp);
router.get('/profile', verifyJWT, authController.getProfile);
router.get('/profile/:id', verifyJWT, authController.getProfile);
router.post('/profile/update', verifyJWT, patientValidation.fullProfileValidation, authController.profileUpdate);
router.post('/addWallet', verifyJWT, wallet.addWalletAmount);
router.get('/transactions', verifyJWT, wallet.getWalletTransactions);
// router.post('/verifyOtp', validation.verifyOtpValidation, authController.verifyOtp);
// router.post('/verifySignUpOTP', validation.verifyOtpSignupValidation, authController.verifySignUpOTP);
// router.post('/signup', validation.signupValidation, authController.signup);
// router.post('/sendOtp', validation.sendOtpValidation, authController.sendOtp);
// router.get('/refreshToken', verifyJWT, authController.refreshToken);
router.post('/paginate', verifyJWT, patientValidation.paginateValidation, authController.getPatientPagination);
router.get('/details/:id', verifyJWT, authController.getPatientById);
router.post('/status/:id', verifyJWT, authController.updatePatientByStatus);

router.use('/signup/steps', verifyJWT, signupStepRouter);
// router.use('/', verifyJWT, signupStepRouter);



module.exports = router;