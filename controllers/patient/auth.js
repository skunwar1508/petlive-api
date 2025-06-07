const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const otpModel = require("../../models/otp.model.js");
const patientModel = require("../../models/patient.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const signup = async (req, res) => {
    try {
        const requestData = req.body;

        let existingUser = await patientModel.findOne({
            phone: requestData.phone,
            isDeleted: false,
        });
        if (existingUser) {
            if (!existingUser.isProfileCompleted) {
                const otpCode = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
                const newOtp = new otpModel({
                    otp: otpCode,
                    phone: requestData.phone,
                    usedFor: "SIGNUP",
                });

                await newOtp.save();
                if (process.env.MODE === "development") {
                    existingUser._doc.otp = otpCode;
                }

                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "otpsentphone"), existingUser);
            }
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));
        }

        let userData = new patientModel({
            phone: requestData.phone,
            isAccept: requestData.isAccept,
            lastStep: 1,
        });

        const user = await userData.save();
        const otpCode = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
        const newOtp = new otpModel({
            otp: otpCode,
            phone: requestData.phone,
            usedFor: "SIGNUP",
        });

        await newOtp.save();

        // Include OTP in the response if in development mode
        if (process.env.MODE === "development") {
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), otpCode);
        }
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), null);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const lastStep = async (req, res) => {
    try {
        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { lastStep: user.lastStep });
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getProfile = async (req, res) => {
    try {
        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const login = async (req, res) => {
    try {
        const requestData = req.body;

        let user = await patientModel.findOne({
            phone: requestData.phone,
            isDeleted: false,
        });
        if (!user || user.isDeleted === true) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }
        if (user.isProfileCompleted === false) {
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { isProfileCompleted: user.isProfileCompleted });
        }
        if (user.isActive === false) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userblocked"));
        }
        const otpCode = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
        const newOtp = new otpModel({
            otp: otpCode,
            phone: requestData.phone,
            usedFor: "LOGIN",
        });

        await newOtp.save();
        // Include OTP in the response if in development mode
        if (process.env.MODE === "development") {
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), otpCode);
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), null);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const verifyLoginOtp = async (req, res) => {
    try {
        const requestData = req.body;

        if (requestData.phone) {
            let otp = await otpModel.find({ phone: requestData.phone, usedFor: "LOGIN" }).sort({ createdAt: -1 }).limit(1);

            if (otp.length === 0) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));
            }

            if (otp[0].otp === requestData.otp) {
                let user = await patientModel.findOne({ phone: requestData.phone, isDeleted: false }).select("-password");

                if (!user) {
                    return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
                }

                let payLoad = {
                    id: user._id,
                    role: roles.patient,
                };

                let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
                    expiresIn: "24h", // expires in 1 Day
                });

                user._doc.token = token;
                await otpModel.deleteOne({ _id: otp[0]._id });

                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
            } else {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
            }
        } else {
            return apiResponse.validationErrorWithData(res, "Phone is required");
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}
const verifyOtp = async (req, res) => {
    try {
        const requestData = req.body;

        if (requestData.phone) {
            let otp = await otpModel.find({ phone: requestData.phone, usedFor: "SIGNUP" }).sort({ createdAt: -1 }).limit(1);

            if (otp.length === 0) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));
            }

            if (otp[0].otp === requestData.otp) {
                let user = await patientModel.findOne({ phone: requestData.phone, isDeleted: false }).select("-password");

                if (!user) {
                    return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
                }

                if (user.isProfileCompleted === true) {
                    return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
                }

                let payLoad = {
                    id: user._id,
                    role: roles.patient,
                };

                let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
                    expiresIn: "24h", // expires in 1 Day
                });

                user._doc.token = token;
                await otpModel.deleteOne({ _id: otp[0]._id });

                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { data: user });
            } else {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
            }
        } else {
            return apiResponse.validationErrorWithData(res, "Phone is required");
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const resendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        const user = await patientModel.findOne({
            phone: phone,
            isDeleted: false,
            isProfileCompleted: false,
        });

        if (!user) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }

        // Generate a new OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
        const newOtp = new otpModel({
            otp: otpCode,
            phone: phone,
            usedFor: "SIGNUP",
        });

        await newOtp.save();

        // Include OTP in the response if in development mode
        if (process.env.MODE === "development") {
            user.otp = otpCode;
        }


        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "otpsent"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep1 = async (req, res) => {
    try {
        const { email } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.email = email;
        user.lastStep = 2;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep2 = async (req, res) => {
    try {
        const { ownerName, ownerGender, ownerDob, ownerImage } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        user.ownerName = ownerName;
        user.ownerGender = ownerGender;
        user.ownerDob = ownerDob;
        user.ownerImage = ownerImage;
        user.lastStep = 3;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep3 = async (req, res) => {
    try {
        const { name, age } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.name = name;
        user.age = age;
        user.lastStep = 4;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep4 = async (req, res) => {
    try {
        const { petType, gender } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.petType = petType;
        user.gender = gender;
        user.lastStep = 5;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep5 = async (req, res) => {
    try {
        const { intrestFor } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.intrestFor = intrestFor;
        user.lastStep = 6;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep6 = async (req, res) => {
    try {
        const { reasonToFind } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.reasonToFind = reasonToFind;
        user.lastStep = 7;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep7 = async (req, res) => {
    try {
        const { weight, breed, color } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.weight = weight;
        user.breed = breed;
        user.color = color;
        user.lastStep = 8;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep8 = async (req, res) => {
    try {
        const { activityLevel, dietaryPreference, trainingBehaviour, outdoorHabits } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.activityLevel = activityLevel;
        user.dietaryPreference = dietaryPreference;
        user.trainingBehaviour = trainingBehaviour;
        user.outdoorHabits = outdoorHabits;
        user.lastStep = 9;
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep9 = async (req, res) => {
    try {
        const { petImages } = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false, isProfileCompleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.petImages = petImages;
        user.isProfileCompleted = true;
        user.lastStep = 10; // Assuming 10 indicates completion
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const profileUpdate = async (req, res) => {
    try {
        const updateData = req.body;

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        // Update fields explicitly
        if (updateData.email !== undefined) user.email = updateData.email;
        if (updateData.ownerName !== undefined) user.ownerName = updateData.ownerName;
        if (updateData.ownerGender !== undefined) user.ownerGender = updateData.ownerGender;
        if (updateData.ownerDob !== undefined) user.ownerDob = updateData.ownerDob;
        if (updateData.ownerImage !== undefined) user.ownerImage = updateData.ownerImage;
        if (updateData.name !== undefined) user.name = updateData.name;
        if (updateData.dob !== undefined) user.dob = updateData.dob;
        if (updateData.petType !== undefined) user.petType = updateData.petType;
        if (updateData.gender !== undefined) user.gender = updateData.gender;
        if (updateData.intrestFor !== undefined) user.interestFor = updateData.intrestFor;
        if (updateData.reasonToFind !== undefined) user.reasonToFind = updateData.reasonToFind;
        if (updateData.weight !== undefined) user.weight = updateData.weight;
        if (updateData.breed !== undefined) user.breed = updateData.breed;
        if (updateData.color !== undefined) user.color = updateData.color;
        if (updateData.activityLevel !== undefined) user.activityLevel = updateData.activityLevel;
        if (updateData.dietaryPreference !== undefined) user.dietaryPreference = updateData.dietaryPreference;
        if (updateData.trainingBehaviour !== undefined) user.trainingBehaviour = updateData.trainingBehaviour;
        if (updateData.outdoorHabits !== undefined) user.outdoorHabits = updateData.outdoorHabits;
        if (updateData.petImages !== undefined) user.petImages = updateData.petImages;

        await user.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

module.exports = {
    signup,
    signupStep1,
    signupStep2,
    signupStep3,
    signupStep4,
    signupStep5,
    signupStep6,
    signupStep7,
    signupStep8,
    signupStep9,
    lastStep,
    getProfile,
    login,
    verifyLoginOtp,
    verifyOtp,
    resendOtp,
    profileUpdate
};
