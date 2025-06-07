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
        'string.pattern.base': 'Invalid breadColor ID'
    }),
});

const createBreadColorSchema = Joi.object({
    name: Joi.string().trim().max(100).required().messages({
        'string.max': 'Name must be at most 100 characters',
        'any.required': 'Name is required'
    }),
    description: Joi.string().allow('').optional(),
    status: Joi.boolean().optional()
});

const updateBreadColorSchema = Joi.object({
    name: Joi.string().trim().max(100).messages({
        'string.max': 'Name must be at most 100 characters'
    }),
    description: Joi.string().allow('').optional(),
    status: Joi.boolean().optional()
});

const updateStatusSchema = Joi.object({
    status: Joi.boolean().required().messages({
        'any.required': 'Status is required',
        'boolean.base': 'Status must be a boolean'
    })
});

const paginateSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    perPage: Joi.number().integer().min(1).optional()
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
exports.getAllBreadColorValidation = []; // No validation needed

exports.getOneBreadColorValidation = [validateJoi(idSchema, 'params')];

exports.createBreadColorValidation = [validateJoi(createBreadColorSchema, 'body')];

exports.updateBreadColorValidation = [
    validateJoi(idSchema, 'params'),
    validateJoi(updateBreadColorSchema, 'body'),
];

exports.deleteBreadColorValidation = [validateJoi(idSchema, 'params')];

exports.paginateBreadColorValidation = [validateJoi(paginateSchema, 'body')];

exports.updateBreadColorStatusValidation = [
    validateJoi(idSchema, 'params'),
    validateJoi(updateStatusSchema, 'body')
];