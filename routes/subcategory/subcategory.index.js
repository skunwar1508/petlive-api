const express = require('express');
const verifyJWT = require('../../utils/jwt');
const categoryController = require('../../controllers/subcategory/subcategory.controller');

const router = express.Router();


// CRUD routes for category
const {
    getAllSubcategoryValidation,
    getOneSubcategoryValidation,
    createSubcategoryValidation,
    updateSubcategoryValidation,
    deleteSubcategoryValidation,
    paginateSubcategoryValidation,
    updateSubcategoryStatusValidation
} = require('../../validations/admin/subcategory.validation');

// Get all subcategories for a category
router.get(
    '/getAll/:categoryId',
    verifyJWT,
    getAllSubcategoryValidation,
    categoryController.getAll
);

// Get one subcategory by id
router.get(
    '/getById/:id',
    verifyJWT,
    getOneSubcategoryValidation,
    categoryController.getOne
);

// Create a new subcategory (admin only)
router.post(
    '/create',
    verifyJWT,
    createSubcategoryValidation,
    categoryController.create
);

// Update a subcategory (admin only)
router.post(
    '/update/:id',
    verifyJWT,
    updateSubcategoryValidation,
    categoryController.update
);

// Delete a subcategory (admin only)
router.delete(
    '/delete/:id',
    verifyJWT,
    deleteSubcategoryValidation,
    categoryController.delete
);

// Paginate subcategories (optionally by categoryId)
router.post(
    '/paginate?',
    verifyJWT,
    paginateSubcategoryValidation,
    categoryController.paginate
);

// Update subcategory status (admin only)
router.post(
    '/updateStatus/:id',
    verifyJWT,
    updateSubcategoryStatusValidation,
    categoryController.updateStatus
);

module.exports = router;