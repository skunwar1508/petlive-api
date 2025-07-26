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
        'string.pattern.base': 'Invalid subcategory ID'
    }),
});

const categoryIdSchema = Joi.object({
    categoryId: Joi.string().pattern(/^[a-f\d]{24}$/i).required().messages({
        'string.pattern.base': 'Invalid category ID'
    }),
});

const createSubcategorySchema = Joi.object({
    name: Joi.string().trim().max(100).required().messages({
        'string.max': 'Name must be at most 100 characters',
        'any.required': 'Name is required'
    }),
    description: Joi.string().allow('').optional(),
    category: Joi.string().pattern(/^[a-f\d]{24}$/i).required().messages({
        'string.pattern.base': 'Invalid category ID',
        'any.required': 'Category is required'
    }),
    status: Joi.boolean().optional(),
});

const updateSubcategorySchema = Joi.object({
    name: Joi.string().trim().max(100).messages({
        'string.max': 'Name must be at most 100 characters'
    }),
    description: Joi.string().allow('').optional(),
    category: Joi.string().pattern(/^[a-f\d]{24}$/i).optional().messages({
        'string.pattern.base': 'Invalid category ID'
    }),
    status: Joi.boolean().optional(),
});

const paginateSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    perPage: Joi.number().integer().min(1).max(100).optional(),
    searchString: Joi.string().trim().allow('', null),
    categoryId: Joi.string().allow('', null)
});

const updateStatusSchema = Joi.object({
    status: Joi.boolean().required().messages({
        'any.required': 'Status is required',
        'boolean.base': 'Status must be a boolean'
    }),
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

// Exports
exports.getAllSubcategoryValidation = [validateJoi(categoryIdSchema, 'params')];

exports.getOneSubcategoryValidation = [validateJoi(idSchema, 'params')];

exports.createSubcategoryValidation = [validateJoi(createSubcategorySchema, 'body')];

exports.updateSubcategoryValidation = [
    validateJoi(idSchema, 'params'),
    validateJoi(updateSubcategorySchema, 'body'),
];

exports.deleteSubcategoryValidation = [validateJoi(idSchema, 'params')];

exports.paginateSubcategoryValidation = [
    validateJoi(paginateSchema, 'body'),
];

exports.updateSubcategoryStatusValidation = [
    validateJoi(idSchema, 'params'),
    validateJoi(updateStatusSchema, 'body'),
];