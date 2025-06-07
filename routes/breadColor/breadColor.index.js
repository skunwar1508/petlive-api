const express = require('express');
const verifyJWT = require('../../utils/jwt');
const breadColorController = require('../../controllers/breadColor/breadcolor.controller');

const router = express.Router();


// CRUD routes for breadColor
const {
    getAllBreadColorValidation,
    getOneBreadColorValidation,
    createBreadColorValidation,
    updateBreadColorValidation,
    deleteBreadColorValidation,
    paginateBreadColorValidation,
    updateBreadColorStatusValidation
} = require('../../validations/admin/breadColor.validation.js');

// Get all bread colors
router.get(
    '/getAll',
    verifyJWT,
    getAllBreadColorValidation,
    breadColorController.getAll
);

// Get bread color by ID
router.get(
    '/getById/:id',
    verifyJWT,
    getOneBreadColorValidation,
    breadColorController.getOne
);

// Create bread color
router.post(
    '/create',
    verifyJWT,
    createBreadColorValidation,
    breadColorController.create
);

// Update bread color
router.put(
    '/update/:id',
    verifyJWT,
    updateBreadColorValidation,
    breadColorController.update
);

// Delete bread color
router.delete(
    '/delete/:id',
    verifyJWT,
    deleteBreadColorValidation,
    breadColorController.delete
);

// Paginate bread colors
router.post(
    '/paginate',
    verifyJWT,
    paginateBreadColorValidation,
    breadColorController.paginate
);

// Update bread color status
router.put(
    '/updateStatus/:id',
    verifyJWT,
    updateBreadColorStatusValidation,
    breadColorController.updateStatus
);

module.exports = router;