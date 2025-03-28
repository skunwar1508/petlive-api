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
const resendValidation = async (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const verifyOtpValidation = async (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().required(),
        otp: Joi.number().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
// ===========================================================================

const signUpValidation = async (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().required(),
        isAccept: Joi.boolean().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step1Validation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step2Validation = async (req, res, next) => {
    const schema = Joi.object({
        ownerName: Joi.string().required(),
        ownerGender: Joi.string().required(),
        ownerDob: Joi.string().required(),
        ownerImage: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step3Validation = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        dob: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step4Validation = async (req, res, next) => {
    const schema = Joi.object({
        petType: Joi.string().required(),
        gender: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step5Validation = async (req, res, next) => {
    const schema = Joi.object({
        intrestFor: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step6Validation = async (req, res, next) => {
    const schema = Joi.object({
        reasonToFind: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step7Validation = async (req, res, next) => {
    const schema = Joi.object({
        weight: Joi.string().required(),
        breed: Joi.string().required(),
        color: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step8Validation = async (req, res, next) => {
    const schema = Joi.object({
        activityLevel: Joi.string().required(),
        dietaryPreference: Joi.string().required(),
        trainingBehaviour: Joi.string().required(),
        outdoorHabits: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

const step9Validation = async (req, res, next) => {
    const schema = Joi.object({
        petImages: Joi.array().items(Joi.string()).required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

// ==========================================================

module.exports = {
    resendValidation,
    verifyOtpValidation,
    signUpValidation,
    step1Validation,
    step2Validation,
    step3Validation,
    step4Validation,
    step5Validation,
    step6Validation,
    step7Validation,
    step8Validation,
    step9Validation,
};
