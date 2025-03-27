const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const otpModel = require("../../models/otp.model.js");
const patientModel = require("../../models/patient.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");

const login = async (req, res) => {
    try {
        const { phone } = req.body;
        let otpCode = Math.floor(100000 + Math.random() * 900000);

        let patient = await patientModel.findOne({ $or: [{ phone: phone }, { email: phone }] });
        if (patient) {
            let newOtp = new otpModel({
                userId: patient._id,
                otp: otpCode,
                email: patient.email,
                phone: patient.phone,
                usedFor: "LOGIN",
            });
            await newOtp.save();

            let resData = {
                patientId: patient._id,
                otp: otpCode,
            }

            if (process.env.MODE === "development") {
                return apiResponse.successResponse(res, `A code (${otpCode}) has been sent to your phone/email. (${phone})`, resData);
            }
            return apiResponse.successResponse(res, `A code has been sent to your phone/email.`, { patientId: patient._id });
        } else {
            return apiResponse.errorMessage(res, 400, "Mobile number is not register, please register before login");
        }

    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================
// ==========================================================
// Login checkyOtp/patient
const verifyOtp = async (req, res) => {
    try {
        const requestData = req.body;
        let otp = await otpModel.find({ userId: requestData.id }).sort({ createdAt: -1 }).limit(1);
        if (otp.length === 0) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));
        }

        if (otp[0].otp === requestData.otp) {
            const patient = await patientModel.findOne({ _id: requestData.id });
            if (!patient) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
            }

            let payLoad = {
                id: patient._id,
                role: roles.patient,
            };

            let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
                expiresIn: "30d", // expires in 1 Day
            });

            patient._doc.token = token;
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), patient);
        }

        return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================
// ==========================================================

const signup = async (req, res) => {
    try {
        const requestData = req.body;
        let existingPatient = await patientModel.findOne({
            // _id: { $ne: requestData.id },
            phone: requestData.phone,
            email: requestData.email,
            isDeleted: false,
        });

        if (existingPatient) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));

        requestData.patientId = generatePateintId();

        let patientData = new patientModel(requestData);
        const patient = await patientData.save();

        let payLoad = {
            id: patient._id,
            role: roles.patient,
        };

        let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
            expiresIn: "24h", // expires in 1 Day
        });

        patient._doc.token = token;
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), patient);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================
// ==========================================================

// checkyOtp signup
const verifySignUpOTP = async (req, res) => {
    try {
        const requestData = req.body;
        if (requestData.phone) {
            let otp = await otpModel.find({ phone: requestData.phone }).sort({ createdAt: -1 }).limit(1);
            if (otp.length === 0) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));
            }

            if (otp[0].otp === requestData.otp) {
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), null);
            }
        } else if (requestData.email) {
            let otp = await otpModel.find({ email: requestData.email }).sort({ createdAt: -1 }).limit(1);
            if (otp.length === 0) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));
            }

            if (otp[0].otp === requestData.otp) {
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), null);
            }
        }

        return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================
// ==========================================================

// checkMobile
const sendOtp = async (req, res) => {
    try {
        const requestData = req.body;
        let existingPatient = await patientModel.findOne({
            // _id: { $ne: requestData.id },
            $or: [{ phone: requestData.phone }, { email : requestData.email }],
            // phone: requestData.phone,
            // email: requestData.email,
            isDeleted: false,
        });
        if (existingPatient) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));

        if (requestData.phone) {
            let otpCode = Math.floor(100000 + Math.random() * 900000);
            console.log(otpCode)

            let newOtp = new otpModel({
                otp: otpCode,
                phone: requestData.phone,
                usedFor: "SIGNUP",
            });
            await newOtp.save();

            if (process.env.MODE === "development") {
                return apiResponse.successResponse(res, `A code (${otpCode}) has been sent to your phone. (${requestData.phone})`, otpCode);
            }
            return apiResponse.successResponse(res, `A code has been sent to your mobile phone.`, null);
        } else if (requestData.email) {
            let otpCode = Math.floor(100000 + Math.random() * 900000);

            let newOtp = new otpModel({
                otp: otpCode,
                email: requestData.email,
                usedFor: "SIGNUP",
            });
            await newOtp.save();

            if (process.env.MODE === "development") {
                return apiResponse.successResponse(res, `A code (${otpCode}) has been sent to your email. (${requestData.email})`, otpCode);
            }
            return apiResponse.successResponse(res, `A code has been sent to your email.`, null);
        } else {
            return apiResponse.errorMessage(res, 400, "Phone or Email is required");
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================
// ==========================================================

const refreshToken = async (req, res) => {
    try {
        let payload = {
            id: req.doc.id,
            role: req.doc.role,
        };
        let token = jwt.sign(payload, process.env.LOGIN_KEY, {
            expiresIn: "30d", // expires in 1 Day
        });

        // return apiResponse.successResponse(res, "Success", { token: token });
        return res.status(200).json({
            status: true,
            message: "Success",
            token,
            data: null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: CMS.Lang_Messages("en", "somethingwentwrong") });
    }
}

// ==========================================================
// ==========================================================

//Function for uniquie Ids
function generatePateintId() {
    const prefix = "LGP";
    const randomNumber = Math.floor(100000 + Math.random() * 9000);
    return `${prefix}${randomNumber}`;
}

module.exports = {
    sendOtp,
    signup,
    verifySignUpOTP,
    login,
    verifyOtp,
    refreshToken
};

