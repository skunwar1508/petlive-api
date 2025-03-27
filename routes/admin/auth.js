const express = require('express');

const authController = require('../../controllers/admin/auth');
const validation = require('../../middleware/admin.validation');
const verifyJWT = require('../../utils/jwt');

const router = express.Router();

router.post('/login', validation.adminLoginValidation, authController.adminLogin);
router.post('/chngpass', verifyJWT, validation.changePassValidation, authController.changePassword);
router.get('/refreshToken', verifyJWT, authController.refreshToken);

module.exports = router;