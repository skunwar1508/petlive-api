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

const serviceValidation = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        time: Joi.number().required(),
        description: Joi.string().required(),
        price: Joi.number().required(),
        status: Joi.boolean().allow(null).optional(),
        image: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const servicePaginationValidation = async (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).required(),
        perPage: Joi.number().integer().min(1).required(),
        searchString: Joi.string().allow(null, '').optional(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};
const serviceStatusValidation = async (req, res, next) => {
    const schema = Joi.object({
        status: Joi.boolean().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
};

module.exports = {
    serviceValidation,
    servicePaginationValidation,
    serviceStatusValidation
};
