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
        otherSpecialisation: Joi.array().items(Joi.string()),
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
    signUpStep7Validation
};

