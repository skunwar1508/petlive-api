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
        phone: Joi.string()
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

const signupValidation = async (req, res, next) => {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.number().required(),
        terms: Joi.boolean().required(),
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

const updatePersonalDetailsValidation = async (req, res, next) => {
    const schema = Joi.object({
        profileImage: Joi.string().allow("", null),
        gender: Joi.string().valid("male", "female", "other").required(),
        dob: Joi.date().required(),
        experience: Joi.string().required(),
        regNumber: Joi.string().required(),
        licenseImage: Joi.string().required(),
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

const updateSpecializationValidation = async (req, res, next) => {
    const schema = Joi.object({
        profileImage: Joi.string().allow("", null),
        primarySpecialization: Joi.string().required(),
        otherPrimarySpecialization: Joi.string().allow(""),
        secondarySpecialization: Joi.string().allow(""),
        otherSecondarySpecialization: Joi.string().allow(""),
        subSpecialization: Joi.string().allow(""),
        qualification: Joi.string().required(),
        qualificationDoc: Joi.string().required(),
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

const updateProfessionalDetailsValidation = async (req, res, next) => {
    const schema = Joi.object({
        profileImage: Joi.string().allow("", null),
        consultationType: Joi.object(),
        clinicName: Joi.string().allow(""),
        clinicLocation: Joi.string().allow(""),
        languagesSpoken: Joi.array().items(Joi.string()).default([]),
        availableDays: Joi.array()
            .items(Joi.string().valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday").required())
            .default([]),
        inPersonFees: Joi.number().required().allow(""),
        onlineFees: Joi.number().required().allow(""),
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

const updateBioValidation = async (req, res, next) => {
    const schema = Joi.object({
        profileImage: Joi.string().allow("", null),
        specialTreatmentArea: Joi.string().allow(""),
        about: Joi.string().allow(""),
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

const updateProfileValidation = async (req, res, next) => {
    const schema = Joi.object({
        profileImage: Joi.string().allow(null),
        gender: Joi.string().valid("male", "female", "other").required(),
        dob: Joi.date().required(),
        experience: Joi.string().required(),
        regNumber: Joi.string().required(),
        licenseImage: Joi.string().required(),
        primarySpecialization: Joi.string().required(),
        secondarySpecialization: Joi.string().allow(""),
        subSpecialization: Joi.string().allow(""),
        qualification: Joi.string().required(),
        qualificationDoc: Joi.string().required(),
        clinicName: Joi.string().allow(""),
        clinicLocation: Joi.string().allow(""),
        languagesSpoken: Joi.array().items(Joi.string()).default([]),
        availableDays: Joi.array()
            .items(Joi.string().valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday").required())
            .default([]),
        inpersonFees: Joi.number().required(),
        onlineFees: Joi.number().required(),
        about: Joi.string().allow(""),
        specialTreatmentArea: Joi.string().allow(""),
        personalDetail: Joi.boolean().default(false),
        specialization: Joi.boolean().default(false),
        professional: Joi.boolean().default(false),
        bio: Joi.boolean().default(false),
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

const addConsultationTimeValidation = async (req, res, next) => {
    const schema = Joi.object({
        consultationType: Joi.string().valid("inperson", "online", "inPerson").required(),
        availableDays: Joi.array().items({
            day: Joi.string().valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday").required(),
            isAvailable: Joi.boolean().default(false),
            availableTime: Joi.array().items(Joi.object({
                startTime: Joi.string().required().allow(""),
                endTime: Joi.string().required().allow(""),
            })),
            consultationDuration: Joi.number().required().allow(""),
            breakTime: Joi.number().required().allow(""),
            // slots: Joi.array().items(Joi.string()).default([]),
        }),
        // fees: Joi.number().required(),
        // onLeave: Joi.array().items({
        //     year: Joi.string().required(),
        //     date: Joi.array(),
        // }),
    });

    const value = schema.validate(req.body);

    if (value.error) {
        const errMsg = await validationCheck(value);
        return await apiResponse.validationErrorWithData(res, errMsg);
    }
    next();
}

const addConsultationFeeValidation = async (req, res, next) => {
    const schema = Joi.object({
        online: Joi.object().keys({ fees: Joi.number().required(), status: Joi.boolean().required() }).required(),
        inperson: Joi.object().keys({ fees: Joi.number().required(), status: Joi.boolean().required() }).required(),
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

const paginateProviderValidation = async (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        searchString: Joi.string().allow("", null),
        groupId: Joi.string().allow("", null),
        filters: Joi.object()
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

const approvalStatusValidation = async (req, res, next) => {
    const schema = Joi.object({
        status: Joi.string().valid("approved", "rejected").required(),
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

const providerStatusValidation = async (req, res, next) => {
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

const providerUpdateValidation = async (req, res, next) => {
    const schema = Joi.object({
        commision: Joi.number().required(),
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


const notesAddValidation = async (req, res, next) => {
    const schema = Joi.object({
        patientId: Joi.string().required(),
        notes: Joi.string().required()
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


const DoctorSlotStatusForSpecificDateValidation = (req, res, next) => {
    const schema = Joi.object({
        date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
        consultationType : Joi.string().valid('inperson', 'online').required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
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






// ==========================================================
// ==========================================================

module.exports = {
    loginValidation,
    verifyOtpValidation,
    verifyOtpSignupValidation,
    signupValidation,
    sendOtpValidation,
    updateProfileValidation,
    updatePersonalDetailsValidation,
    updateProfessionalDetailsValidation,
    updateSpecializationValidation,
    updateBioValidation,
    updateProfileValidation,
    addConsultationTimeValidation,
    paginateProviderValidation,
    providerStatusValidation,
    contactValidation,
    approvalStatusValidation,
    addConsultationFeeValidation,
    notesAddValidation,
    DoctorSlotStatusForSpecificDateValidation,
    providerUpdateValidation,
    cancellationValidation
};

