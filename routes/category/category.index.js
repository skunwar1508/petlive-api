const express = require('express');
const verifyJWT = require('../../utils/jwt');
const categoryController = require('../../controllers/category/category.controller');

const router = express.Router();


// CRUD routes for category
const {
    getAllCategoryValidation,
    getOneCategoryValidation,
    createCategoryValidation,
    updateCategoryValidation,
    deleteCategoryValidation
} = require('../../validations/admin/category.validation');

router.get(
    '/getAll',
    verifyJWT,
    getAllCategoryValidation,
    categoryController.getAll
);

router.get(
    '/getById/:id',
    verifyJWT,
    getOneCategoryValidation,
    categoryController.getOne
);

router.post(
    '/create',
    verifyJWT,
    createCategoryValidation,
    categoryController.create
);

router.put(
    '/update/:id',
    verifyJWT,
    updateCategoryValidation,
    categoryController.update
);

router.delete(
    '/delete/:id',
    verifyJWT,
    deleteCategoryValidation,
    categoryController.delete
);

module.exports = router;