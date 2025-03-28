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



// ==========================================================
// ==========================================================

module.exports = {
    signUpStepValidation,
    signUpResendValidation,
    signUpVerifyValidation
};

