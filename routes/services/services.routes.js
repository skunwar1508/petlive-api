const express = require('express');
const verifyJWT = require('../../utils/jwt.js');
const router = express.Router();

// Import your service controller functions
const {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    servicePagination,
    serviceStatusUpdate
} = require('./../../controllers/services/services.controller.js');
const { serviceValidation, servicePaginationValidation, serviceStatusValidation } = require('../../validations/services/services.validation.js');


// CRUD routes for services (no multer)
router.post(
    '/create',
    verifyJWT,
    serviceValidation,
    createService // expects { name, time, description, price } in req.body
);
router.get('/getAll', verifyJWT, getAllServices);
router.get('/getById/:id', verifyJWT, getServiceById);
router.post('/status/:id', verifyJWT, serviceStatusValidation, serviceStatusUpdate); // expects { status } in req.body
router.post('/update/:id', verifyJWT, serviceValidation, updateService);
router.post('/pagination', verifyJWT, servicePaginationValidation, servicePagination);

module.exports = router;