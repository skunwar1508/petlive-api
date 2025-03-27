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

const sendOtpValidation = async (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.allow("", null),
        email: Joi.string().email().allow("", null),
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

const verifyOtpSignupValidation = async (req, res, next) => {
    const schema = Joi.object({
        otp: Joi.number().required(),
        phone: Joi.allow("", null),
        email: Joi.string().email().allow("", null),
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
        phone: Joi.required(),
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

const verifyOtpValidation = async (req, res, next) => {
    const schema = Joi.object({
        otp: Joi.number().required(),
        id: Joi.string().required(),
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

const signupValidation = async(req, res, next) => {
    const schema = Joi.object({
        fullName: Joi.string().required(),
        gender: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        aadhar: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if(value.error){
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

// ==========================================================
// ==========================================================

const lapReportValidation = async(req, res, next) => {
    const schema = Joi.object({
        categoryId: Joi.string().required(),
        image: Joi.string().required(),
        name: Joi.string().required(),
        type: Joi.string().required(),
    });

    const value = schema.validate(req.body);

    if(value.error){
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

// ==========================================================
// ==========================================================


const contactValidation = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required(),
        subject: Joi.string().required(),
        description: Joi.string().required(),
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


const bookComsultationValidation = async (req, res, next) => {
    const schema = Joi.object({
        doctorId: Joi.string().required(),
        day: Joi.string().required(),
        date: Joi.string().required(),
        slotId: Joi.string().required(),
        consultationType: Joi.string().required(),
        consultaionReason : Joi.string().allow(null, "")
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


const razorpayValidation = async (req, res, next) => {
    const schema = Joi.object({
        consultId: Joi.string().required(),
        amount: Joi.number().required(),
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

const razorpayVerifyValidation = async (req, res, next) => {
    const schema = Joi.object({
        razorpay_order_id: Joi.string().required(),
        razorpay_payment_id: Joi.string().required(),
        razorpay_signature: Joi.string().required(),
        orderId: Joi.string().required(),
        consultId: Joi.string().required(),
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

const getConsultationValidation = async (req, res, next) => {
    const schema = Joi.object({
        doctorId: Joi.string().required(),
        date: Joi.string().required(),
        consultationType: Joi.string().valid('inperson', 'online').required(),
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

const paginateValidation = async (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        searchString: Joi.string().allow("", null),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

// ==========================================================
// ==========================================================

const cancellationValidation = async (req, res, next) => {
    const schema = Joi.object({
        reason: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

module.exports = {
    sendOtpValidation,
    verifyOtpSignupValidation,
    loginValidation,
    verifyOtpValidation,
    signupValidation,
    contactValidation,
    lapReportValidation,
    bookComsultationValidation,
    razorpayValidation,
    razorpayVerifyValidation,
    getConsultationValidation,
    paginateValidation,
    cancellationValidation
};
