const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const otpModel = require("../../models/otp.model.js");
const doctorModel = require("../../models/doctor.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
const bcrypt = require("bcrypt");
// const sendSms = require("../../utils/smsService.js");

const verifySignUpOTP = async (req, res) => {
    try {
        const requestData = req.body;
        if (requestData.email.toLowerCase()) {
            let otp = await otpModel.find({ email: requestData.email.toLowerCase(), usedFor: "SIGNUP" }).sort({ createdAt: -1 }).limit(1);
            
            if (otp.length === 0) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));

            if (otp[0].otp === requestData.otp) {
                let doctor = await doctorModel.findOne({ email: requestData.email.toLowerCase(), isDeleted: false, approveProfile: { $ne: "rejected" } }).select("-password");
                if (doctor.isProfileCompleted === true) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistemail"));
                
                console.log(doctor)
                let payLoad = {
                    id: doctor._id,
                    role: roles.doctor,
                };
                let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
                    expiresIn: "24h", // expires in 1 Day
                });
                doctor._doc.token = token;
                await otpModel.deleteOne({ _id: otp[0]._id });
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { data: doctor });
            }
        } else {
            return apiResponse.validationErrorWithData(res, "Email is required");
        }
        return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const resendOTP = async (req, res) => {
    try {
        const requestData = req.body;

        if (!requestData.email) {
            return apiResponse.validationErrorWithData(res, "Email is required");
        }
        let existingDoctor = await doctorModel.findOne({
            email: requestData.email.toLowerCase(),
            isDeleted: false,
            isProfileCompleted: false,
            approveProfile: { $ne: "rejected" },
        });

        if (!existingDoctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistemail"));
        }

        let otpCode = Math.floor(100000 + Math.random() * 9000);
        let newOtp = new otpModel({
            otp: otpCode,
            email: requestData.email.toLowerCase(),
            usedFor: "SIGNUP",
        });

        await newOtp.save();

        if (process.env.MODE === "development") {
            console.log(`An OTP ${otpCode} has been sent to your email ${requestData.email}`);
        } else {
            // Add logic to send OTP via email service
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "otpsentemail"), { otp: process.env.MODE === "development" ? otpCode : null });
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
// ==========================================================================
// ==========================================================================

const signup = async (req, res) => {
    try {
        const requestData = req.body;
        let existingDoctor = await doctorModel.findOne({
            // _id: { $ne: requestData.id },
            email: requestData.email.toLowerCase(),
            isDeleted: false,
            approveProfile : { $ne: "rejected" }
        });

        if (existingDoctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));

        const hashedPassword = await bcrypt.hash(requestData.password, 10);

        let doctorData = new doctorModel({
            name: requestData.name,
            email: requestData.email.toLowerCase(),
            password: hashedPassword,
            lastStep:1
        });

        doctorData.doctorId = generateDoctorId();
        const doctor = await doctorData.save();

        
         if (requestData.email.toLowerCase()) {
            let otpCode = Math.floor(100000 + Math.random() * 9000);
            let newOtp = new otpModel({
                otp: otpCode,
                email: requestData.email.toLowerCase(),
                usedFor: "SIGNUP",
            });

            await newOtp.save();

            if (process.env.MODE === "development") {
                doctor._doc.otp = otpCode;
                return apiResponse.successResponse(res, `An OTP ${otpCode} has been sent to your email ${requestData.email}`, doctor);
            } else {
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
            }
        }

        
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
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
    signup,
    resendOTP,
    verifySignUpOTP
};
