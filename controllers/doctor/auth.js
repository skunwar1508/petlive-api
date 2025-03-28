const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const otpModel = require("../../models/otp.model.js");
const doctorModel = require("../../models/doctor.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
const bcrypt = require("bcrypt");
// const sendSms = require("../../utils/smsService.js");

const login = async (req, res) => {
    try {
        const requestData = req.body;

        if (!requestData.email || !requestData.password) {
            return apiResponse.validationErrorWithData(res, "Email and password are required");
        }

        let doctor = await doctorModel.findOne({ email: requestData.email.toLowerCase(), isProfileCompleted:true, isDeleted: false });
        if (!doctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }
        if(doctor.approveProfile === "rejected") {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "profileRejected"));
        }
        if(doctor.approveProfile === "pending") {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "profilePending"));
        }


        const isPasswordValid = await bcrypt.compare(requestData.password, doctor.password);
        if (!isPasswordValid) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "invalidcredentials"));
        }

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
};



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

        if (existingDoctor) {
            if (!existingDoctor.isProfileCompleted) {
                let otpCode = Math.floor(100000 + Math.random() * 9000);
                let newOtp = new otpModel({
                    otp: otpCode,
                    email: requestData.email.toLowerCase(),
                    usedFor: "SIGNUP",
                });

                await newOtp.save();

                if (process.env.MODE === "development") {
                    existingDoctor._doc.otp = otpCode;
                }

                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "otpsentemail"), existingDoctor);
            }
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistemail"));
        };

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
const signupStep1 = async (req, res) => {
    // update profileImage
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted:false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.profileImage = requestData.profileImage;
        doctor.lastStep = 2;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

// ==========================================================================
// ==========================================================================

const signupStep2 = async (req, res) => {
    // update gender
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted:false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.gender = requestData.gender;
        doctor.lastStep = 3;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

const signupStep3 = async (req, res) => {
    // update age
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.age = requestData.age;
        doctor.lastStep = 4;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep4 = async (req, res) => {
    // update experience, registrationNo, licenceImage
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.experience = requestData.experience;
        doctor.registrationNo = requestData.registrationNo;
        doctor.licenceImage = requestData.licenceImage;
        doctor.lastStep = 5;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep5 = async (req, res) => {
    // update animalPreference
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.animalPreference = requestData.animalPreference;
        doctor.lastStep = 6;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep6 = async (req, res) => {
    // update primarySpecialisation, otherSpecialisation
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.primarySpecialisation = requestData.primarySpecialisation;
        doctor.otherSpecialisation = requestData.otherSpecialisation;
        doctor.lastStep = 7;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep7 = async (req, res) => {
    // update bio
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false, approveProfile: { $ne: "rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.bio = requestData.bio;
        doctor.isProfileCompleted = true;
        doctor.lastStep = 8;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

// ==========================================================================
// ==========================================================================


module.exports = {
    login,
    signup,
    resendOTP,
    verifySignUpOTP,
    signupStep1,
    signupStep2,
    signupStep3,
    signupStep4,
    signupStep5,
    signupStep6,
    signupStep7
};
