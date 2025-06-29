const express = require('express');

const authController = require('../../../controllers/doctor/auth');

const validation = require('../../../middleware/doctor.validation');
const verifyJWT = require('../../../utils/jwt');

const router = express.Router();

router.post('/1', validation.signUpStep1Validation, authController.signupStep1);
router.post('/2', validation.signUpStep2Validation, authController.signupStep2);
router.post('/3', validation.signUpStep3Validation, authController.signupStep3);
router.post('/4', validation.signUpStep4Validation, authController.signupStep4);
router.post('/5', validation.signUpStep5Validation, authController.signupStep5);
router.post('/6', validation.signUpStep6Validation, authController.signupStep6);
router.post('/7', validation.signUpStep7Validation, authController.signupStep7);
router.post('/8', validation.signUpStep8Validation, authController.signupStep8);

module.exports = router;