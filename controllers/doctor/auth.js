const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const otpModel = require("../../models/otp.model.js");
const doctorModel = require("../../models/doctor.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
// const sendSms = require("../../utils/smsService.js");

const login = async (req, res) => {
    try {
        let otpCode = Math.floor(100000 + Math.random() * 9000);

        let doctor = await doctorModel.findOne({ approveProfile : { $ne : "rejected"}, $or: [{ phone: req.body?.phone }, { email: req.body?.phone.toLowerCase() }] });
        if (!doctor) return apiResponse.errorMessage(res, 400, "Mobile number is not register, please register before login");

        if (doctor.approveProfile === 'pending') {
            return apiResponse.errorMessage(res, 400, "Your profile is not approved yet, please contact admin");
        } else if (doctor.approveProfile === 'rejected') {
            return apiResponse.errorMessage(res, 400, "Your profile is rejected by admin, please contact admin");
        }
        if (doctor.isEnabled == false) return apiResponse.errorMessage(res, 400, "Your profile had been disbled, please contact admin");

        let newOtp = new otpModel({
            userId: doctor._id,
            otp: otpCode,
            email: doctor.email.toLowerCase(),
            phone: doctor.phone,
            usedFor: "LOGIN",
        });
        await newOtp.save();

        let resData = {
            doctorId: doctor._id,
            otp: otpCode,
        }
        // if(req.body.phone){
        //     const message = `Your OTP is: ${otpCode}`;
        //     const response = await sendSms(req.body.phone, message);
        //     console.log(response);
        // }

        if (process.env.MODE === "development") {
            return apiResponse.successResponse(res, `A code [${otpCode}] has been sent to your phone/email [${req.body.phone || req.body.email}]`, resData);
        }
        return apiResponse.successResponse(res, `A code has been sent to your phone/email.`, { doctorId: resData.doctorId });
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================================
// ==========================================================================

const verifyOtp = async (req, res) => {
    try {
        const { id, otp } = req.body;
        let otpData = await otpModel.find({ userId: id }).sort({ createdAt: -1 }).limit(1);
        if (otpData.length === 0) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));

        if (otpData[0].otp === otp) {
            const doctor = await doctorModel.findOne({ _id: id });
            if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

            let payLoad = {
                id: doctor._id,
                role: roles.doctor,
            };

            let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
                expiresIn: "30d", // expires in 1 Day
            });

            doctor._doc.token = token;
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
        }
        return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================================
// ==========================================================================

const verifySignUpOTP = async (req, res) => {
    try {
        const requestData = req.body;
        if (requestData.phone) {
            let otp = await otpModel.find({ phone: requestData.phone }).sort({ createdAt: -1 }).limit(1);
            if (otp.length === 0) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));

            if (otp[0].otp === requestData.otp) {
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { data: null });
            }
        } else if (requestData.email.toLowerCase()) {
            let otp = await otpModel.find({ email: requestData.email.toLowerCase() }).sort({ createdAt: -1 }).limit(1);
            if (otp.length === 0) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));

            if (otp[0].otp === requestData.otp) {
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { data: null });
            }
        } else {
            return apiResponse.validationErrorWithData(res, "Phone or Email is required");
        }
        return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================================
// ==========================================================================

const signup = async (req, res) => {
    try {
        const requestData = req.body;
        let existingDoctor = await doctorModel.findOne({
            // _id: { $ne: requestData.id },
            phone: requestData.phone,
            email: requestData.email.toLowerCase(),
            isDeleted: false,
            approveProfile : { $ne: "rejected" }
        });

        if (existingDoctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));

        let doctorData = new doctorModel({
            firstName: requestData.firstName,
            lastName: requestData.lastName,
            phone: requestData.phone,
            email: requestData.email.toLowerCase(),
            adminCommission : 10
        });

        doctorData.doctorId = generateDoctorId();
        const doctor = await doctorData.save();

        let payLoad = {
            id: doctor._id,
            role: roles.doctor,
        };

        let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
            expiresIn: "24h", // expires in 1 Day
        });

        doctor._doc.token = token;
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================================
// ==========================================================================

const sendOtp = async (req, res) => {
    try {
        const requestData = req.body;
        if (requestData.phone) {
            let otpCode = Math.floor(100000 + Math.random() * 9000);
            let doctor = await doctorModel.findOne({ phone: requestData.phone, isDeleted: false, approveProfile : { $ne : 'rejected'} });
            if (doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexist"));

            let newOtp = new otpModel({
                otp: otpCode,
                phone: requestData.phone,
                usedFor: "SIGNUP",
            });

            await newOtp.save();

            if (process.env.MODE === "development") {
                return apiResponse.successResponse(res, `An OTP ${otpCode} has been sent to your mobile number ${requestData.phone}`, otpCode);
                return { error: null, data: { data: otpCode, status: true } };
            }
            return apiResponse.successResponse(res, `An OTP has been sent to your mobile number ${requestData.phone}`, null);
        } else if (requestData.email.toLowerCase()) {
            let otpCode = Math.floor(100000 + Math.random() * 9000);
            let doctor = await doctorModel.findOne({ email: requestData.email.toLowerCase(), isDeleted: false, approveProfile : { $ne : 'rejected'} });
            if (doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistemail"));

            let newOtp = new otpModel({
                otp: otpCode,
                email: requestData.email.toLowerCase(),
                usedFor: "SIGNUP",
            });

            await newOtp.save();
            if (process.env.MODE === "development") {
                return apiResponse.successResponse(res, `An OTP ${otpCode} has been sent to your email ${requestData.email}`, otpCode);
                return { error: null, data: { data: otpCode, status: true } };
            }
            return apiResponse.successResponse(res, `An OTP has been sent to your email ${requestData.email.toLowerCase()}`, null);
        } else {
            return apiResponse.errorMessage(res, 400, "Phone or Email is required");
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================================
// ==========================================================================

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

//Function for uniquie Ids
function generateDoctorId() {
    const prefix = "LGD";
    const randomNumber = Math.floor(100000 + Math.random() * 9000);
    return `${prefix}${randomNumber}`;
}

// ==========================================================================
// ==========================================================================


module.exports = {
    login,
    verifyOtp,
    verifySignUpOTP,
    signup,
    sendOtp,
    refreshToken,
};
