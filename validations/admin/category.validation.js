const Joi = require('joi');
const apiResponse = require('../../utils/apiResponse');

// Error formatting helper
const validationCheck = async (value) => {
    let msg = value.error.details[0].message;
    msg = msg.replace(/"/g, "");
    msg = msg.replace('_', " ");
    msg = msg.replace('.', " ");
    const errorMessage = "Validation error : " + msg;
    return errorMessage;
};

// Schemas
const idSchema = Joi.object({
    id: Joi.string().pattern(/^[a-f\d]{24}$/i).required().messages({
        'string.pattern.base': 'Invalid category ID'
    }),
});

const createCategorySchema = Joi.object({
    name: Joi.string().trim().max(100).required().messages({
        'string.max': 'Name must be at most 100 characters',
        'any.required': 'Name is required'
    }),
    description: Joi.string().allow('').optional(),
});

const updateCategorySchema = Joi.object({
    name: Joi.string().trim().max(100).messages({
        'string.max': 'Name must be at most 100 characters'
    }),
    description: Joi.string().allow('').optional(),
});

// Middleware
const validateJoi = (schema, source = 'body') => async (req, res, next) => {
    const value = schema.validate(req[source]);
    if (value.error) {
        const errMsg = await validationCheck(value);
        return apiResponse.validationErrorWithData(res, errMsg);
    }
    req[source] = value.value;
    next();
};

const paginateCategorySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    perPage: Joi.number().integer().min(1).max(100).optional(),
    searchString: Joi.string().trim().allow('').optional(),
});

exports.paginateCategoryValidation = [validateJoi(paginateCategorySchema, 'body')];

// Exports
exports.getAllCategoryValidation = []; // No validation needed

exports.getOneCategoryValidation = [validateJoi(idSchema, 'params')];

exports.createCategoryValidation = [validateJoi(createCategorySchema, 'body')];

exports.updateCategoryValidation = [
    validateJoi(idSchema, 'params'),
    validateJoi(updateCategorySchema, 'body'),
];

exports.deleteCategoryValidation = [validateJoi(idSchema, 'params')];