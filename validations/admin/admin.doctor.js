const Joi = require("joi");
const apiResponse = require("../../utils/apiResponse");
const validationCheck = async (value) => {
    let msg = value.error.details[0].message;
    console.log(msg);

    msg = msg.replace(/"/g, "");
    msg = msg.replace('_', " ");
    msg = msg.replace('.', " ");

    const errorMessage = "Validation error : " + msg;
    return errorMessage;
}
const recommendedValidation = async (req, res, next) => {
    const schema = Joi.object({
        doctorId: Joi.string().required(),
        recommended: Joi.boolean().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

const onlineStatusValidation = async (req, res, next) => {
    const schema = Joi.object({
        isOnline: Joi.boolean().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

module.exports = {
    recommendedValidation,
    onlineStatusValidation
};
