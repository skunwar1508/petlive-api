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

const adminLoginValidation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
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


const loginValidation = async (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().min(8).max(15).required(),
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

const changePassValidation = async (req, res, next) => {
    const schema = Joi.object({
        oldPassword: Joi.string().required(),
        password: Joi.string().required(),
        confirmPassword: Joi.string().required(),
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


const addCategoryValidator = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(""),
    })

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

// ==========================================================
// ==========================================================

const paginateValidation = async (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        searchString: Joi.string().allow("", null),
        type: Joi.string().allow("primary", "secondary", null),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}


// ==========================================================
// ==========================================================

const statusValidation = async (req, res, next) => {
    const schema = Joi.object({
        status: Joi.boolean().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

// ==========================================================
// ==========================================================

const specializationValidation = async (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        type: Joi.string().allow("primary", "secondary", null)
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

const contactsPaginateValidation = async (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        searchString: Joi.string().allow(""),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

const updateCommissionValidation = async (req, res, next) => {
    const schema = Joi.object({
        commissionPercentage: Joi.number().required(),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

module.exports = {
    adminLoginValidation,
    loginValidation,
    changePassValidation,
    addCategoryValidator,
    paginateValidation,
    statusValidation,
    specializationValidation,
    contactsPaginateValidation,
    updateCommissionValidation
};

