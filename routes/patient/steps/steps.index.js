const express = require('express');

const authController = require('../../../controllers/patient/auth');

const validation = require('../../../middleware/patient.validation');
const verifyJWT = require('../../../utils/jwt');

const router = express.Router();

router.post('/1', validation.step1Validation, authController.signupStep1);
router.post('/2', validation.step2Validation, authController.signupStep2);
router.post('/3', validation.step3Validation, authController.signupStep3);
router.post('/4', validation.step4Validation, authController.signupStep4);
router.post('/5', validation.step5Validation, authController.signupStep5);
router.post('/6', validation.step6Validation, authController.signupStep6);
router.post('/7', validation.step7Validation, authController.signupStep7);
router.post('/8', validation.step8Validation, authController.signupStep8);
router.post('/9', validation.step9Validation, authController.signupStep9);

module.exports = router;