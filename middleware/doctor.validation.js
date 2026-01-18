const Joi = require("joi");
const apiResponse = require("../utils/apiResponse");

const validationCheck = async (value) => {
    let msg = value.error.details[0].message;
    console.log(msg);

    msg = msg.replace(/"/g, "");
    msg = msg.replace('_', " ");
    msg = msg.replace('.', " ");

    const errorMessage = "Validation error : " + msg;
    return errorMessage;
}

// ===========================================================================

const loginValidation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string(),
        password: Joi.string()
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ===========================================================================

const signUpStepValidation = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string(),
        email: Joi.string(),
        password: Joi.string()
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
// ===========================================================================

const signUpVerifyValidation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string(),
        otp: Joi.number(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const signUpResendValidation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const signUpStep1Validation = async (req, res, next) => {
    const schema = Joi.object({
        profileImage: Joi.string(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const signUpStep2Validation = async (req, res, next) => {
    const schema = Joi.object({
        gender: Joi.string(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const signUpStep3Validation = async (req, res, next) => {
    const schema = Joi.object({
        dob: Joi.string(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const signUpStep4Validation = async (req, res, next) => {
    const schema = Joi.object({
        experience: Joi.number().integer().min(0),
        registrationNo: Joi.string(),
        licenceImage: Joi.string(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const signUpStep5Validation = async (req, res, next) => {
    // "animalPreference": ["Dog", "Cat"]
    const schema = Joi.object({
        animalPreference: Joi.array().items(Joi.string().valid("Dog", "Cat")).required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const signUpStep6Validation = async (req, res, next) => {
    const schema = Joi.object({
        primarySpecialisation: Joi.string(),
        otherSpecialisation: Joi.string(),
        services: Joi.array().items(Joi.string()).required(), // expects array or object of services
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const signUpStep7Validation = async (req, res, next) => {
    const schema = Joi.object({
        bio: Joi.string(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const signUpStep8Validation = async (req, res, next) => {
    const schema = Joi.object({
        services: Joi.array().items(Joi.string()).required(), // expects array or object of services
    });
    const value = schema.validate(req.body);
    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const paginValidation = async (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        perPage: Joi.number().integer().min(1).max(100).default(10),
        searchString: Joi.string().allow('').optional(),
        sort: Joi.string().optional(),
        order: Joi.string().valid('asc', 'desc').optional().default('asc'),
        filters: Joi.object({
            profileStatus: Joi.boolean().allow(null),
            verificationStatus: Joi.string().allow(null, ""),
        }).optional(),
    });

    const value = schema.validate(req.query);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    
    // Add validated and defaulted values to the request
    req.pagination = value.value;
    next();
};

const consultationValidation = async (req, res, next) => {
    const schema = Joi.object({
        consultationFee: Joi.number().greater(0).required()
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const updateProfileValidation = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().allow(null, ''),
        gender: Joi.string().valid('Male', 'Female', 'Other').required(),
        dob: Joi.string().isoDate().required(),
        experience: Joi.number().integer().min(0).required(),
        registrationNo: Joi.string().required(),
        profileImage: Joi.string().allow(null, ''),
        licenceImage: Joi.string().allow(null, ''),
        primarySpecialisation: Joi.string().required(),
        otherSpecialisation: Joi.string().allow('', null),
        services: Joi.array().items(Joi.string()).required(),
        consultationFee: Joi.string().allow(null, ''),
        animalPreference: Joi.array().items(Joi.string().valid("Dog", "Cat")).required(),
        bio: Joi.string().required()
    });
    const value = schema.validate(req.body);
    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const forgotPasswordValidation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    const value = schema.validate(req.body);
    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
// ==========================================================
// ==========================================================

module.exports = {
    loginValidation,
    signUpStepValidation,
    signUpResendValidation,
    signUpVerifyValidation,
    signUpStep1Validation,
    signUpStep2Validation,
    signUpStep3Validation,
    signUpStep4Validation,
    signUpStep5Validation,
    signUpStep6Validation,
    signUpStep7Validation,
    signUpStep8Validation,
    paginValidation,
    consultationValidation,
    updateProfileValidation,
    forgotPasswordValidation
};

