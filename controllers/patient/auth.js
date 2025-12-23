const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const otpModel = require("../../models/otp.model.js");
const patientModel = require("../../models/patient.model.js");
const roles = require("../../utils/roles.js");
const apiResponse = require("../../utils/apiResponse.js");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { default: mongoose } = require("mongoose");

const signup = async (req, res) => {
    try {
        const requestData = req.body;

        let existingUser = await patientModel.findOne({
            phone: requestData.phone,
            isDeleted: false,
        });
        if (existingUser) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));
            // if (!existingUser.isProfileCompleted) {
            //     const otpCode = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
            //     const newOtp = new otpModel({
            //         otp: otpCode,
            //         phone: requestData.phone,
            //         usedFor: "SIGNUP",
            //     });

            //     await newOtp.save();
            //     if (process.env.MODE === "development") {
            //         existingUser._doc.otp = otpCode;
            //     }

            //     return apiResponse.successResponse(res, CMS.Lang_Messages("en", "otpsentphone"), {
            //         otpCode,
            //         lastStep: existingUser.lastStep,
            //     }, existingUser);
            // }
            // return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));
        }

        // let userData = new patientModel({
        //     phone: requestData.phone,
        //     isAccept: requestData.isAccept,
        //     lastStep: 1,
        // });

        // const user = await userData.save();
        const otpCode = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
        const newOtp = new otpModel({
            otp: otpCode,
            phone: requestData.phone,
            usedFor: "SIGNUP",
        });

        await newOtp.save();

        // Include OTP in the response if in development mode
        if (process.env.MODE === "development") {
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { otpCode: otpCode });
        }
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), null);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const signupWeb = async (req, res) => {
    try {
        const reqBody = req.body;

        // Check if user already exists (by phone or email)
        let existingUser = await patientModel.findOne({
            $or: [
                { phone: reqBody.phone, isDeleted: false },
                { email: reqBody.email, isDeleted: false }
            ]
        });
        if (existingUser) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistswithcreds"));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(reqBody.password, 10);

        // Create new user
        let userData = new patientModel({
            name: reqBody.name,
            phone: reqBody.phone,
            email: reqBody.email,
            password: hashedPassword,
            securityQuestion: reqBody.securityQuestion,
            securityAnswer: reqBody.securityAnswer,
            isAccept: true,
            isVerified: true,
            userType: "WEB",
            lastStep: 1,
        });

        const user = await userData.save();

        // Generate JWT token
        let payLoad = {
            id: user._id,
            role: roles.patient,
        };

        let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
            expiresIn: "24h",
        });

        user._doc.token = token;

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const loginWeb = async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;

        if (!emailOrPhone || !password) {
            return apiResponse.validationErrorWithData(res, "Email/Phone and password are required.");
        }

        // Find user by email or phone
        let user = await patientModel.findOne({
            $or: [
                { email: emailOrPhone, isDeleted: false },
                { phone: emailOrPhone, isDeleted: false }
            ],
            userType: "WEB"
        });

        if (!user) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }

        // Check if password exists before comparing
        if (!user.password) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongpassword"));
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongpassword"));
        }

        // Generate JWT token
        let payLoad = {
            id: user._id,
            role: roles.patient,
        };

        let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
            expiresIn: "24h",
        });

        user._doc.token = token;

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const forgetWeb = async (req, res) => {
    try {
        const { emailOrPhone, securityQuestion, securityAnswer, newPassword } = req.body;


        // Find user by email or phone
        let user = await patientModel.findOne({
            $or: [
                { email: emailOrPhone, isDeleted: false },
                { phone: emailOrPhone, isDeleted: false }
            ],
            userType: "WEB"
        });

        if (!user) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }


        // Check security question and answer
        if (
            user.securityQuestion !== securityQuestion ||
            user.securityAnswer !== securityAnswer
        ) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongsecurityanswer"));
        }

        // Hash new password and update
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "passwordreset"), null);
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
        let userId;
        let role = req.doc.role;
        if (role === roles.patient) {
            userId = req.doc.id;
        } else if (role === roles.admin) {
            userId = req.params.id;
        } else {
            return apiResponse.errorMessage(res, 403, "Access denied.");
        }
        let user = await patientModel.findOne({ _id: userId, isDeleted: false })
            .populate([
                { path: "ownerImage", select: "_id path" },
                { path: "petImages", select: "_id path" },
                { path: "petType", select: "_id name" }
            ]);
        // Calculate profile completion percentage based on required fields
        const profileFields = [
            'phone',
            'email',
            'ownerName',
            'ownerGender',
            'ownerDob',
            'ownerImage',
            'name',
            'age',
            'petType',
            'gender',
            'interestFor',
            'reasonToFind',
            'weight',
            'breed',
            'color',
            'activityLevel',
            'dietaryPreference',
            'trainingBehaviour',
            'outdoorHabits',
            'petImages'
        ];

        let filledFields = 0;
        if (role === roles.patient) {
            profileFields.forEach(field => {
                if (Array.isArray(user[field])) {
                    if (user[field] && user[field].length > 0) filledFields++;
                } else if (user[field] !== undefined && user[field] !== null && user[field] !== '') {
                    filledFields++;
                }
            });

            const profileCompletion = Math.round((filledFields / profileFields.length) * 100);
            user = user.toObject();
            user.profileCompletion = profileCompletion;
        }
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
        // if (user.isProfileCompleted === false) {
        //     return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), { isProfileCompleted: user.isProfileCompleted });
        // }
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

                // if (user.isProfileCompleted === false) {
                //     return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), user);
                // }

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
                // let user = await patientModel.findOne({ phone: requestData.phone, isDeleted: false }).select("-password");

                // if (!user) {
                //     return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
                // }

                // if (user.isProfileCompleted === true) {
                //     return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
                // }
                let userData = new patientModel({
                    phone: requestData.phone,
                    isAccept: requestData.isAccept,
                    isVerified: true,
                    lastStep: 1,
                });

                const saveUser = await userData.save();
                let payLoad = {
                    id: userData._id,
                    role: roles.patient,
                };

                let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
                    expiresIn: "24h", // expires in 1 Day
                });

                userData._doc.token = token;
                await otpModel.deleteOne({ _id: otp[0]._id });

                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), userData);
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.petType = petType;
        user.gender = gender;
        user.isProfileCompleted = true
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
        if (!user) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));

        user.interestFor = intrestFor;
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
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

        let user = await patientModel.findOne({ _id: req.doc.id, isDeleted: false });
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

const getPatientPagination = async (req, res) => {
    try {
        if (!req.doc || req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, "Access denied. Admins only.");
        }
        const { page, perPage, searchString, filters } = req.body;

        const query = {
            isDeleted: false,
            isProfileCompleted: true
        };

        if (searchString) {
            query.$or = [
                { name: { $regex: searchString, $options: 'i' } },
                { phone: { $regex: searchString, $options: 'i' } }
            ];
        }

        if (filters?.profileStatus !== undefined) {
            query.isActive = filters.profileStatus;
        }
        const patients = await patientModel.find(query)
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('ownerImage', '_id path')
            .populate('petImages', '_id path');

        const totalCount = await patientModel.countDocuments(query);

        return apiResponse.successResWithPagination(res, CMS.Lang_Messages("en", "success"), patients, totalCount);
    } catch (error) {
        console.error("Error fetching patient pagination:", error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getPatientById = async (req, res) => {
    try {
        const patientId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "invalidpatientid"));
        }

        const patient = await patientModel.findOne({ _id: patientId, isDeleted: false })
            .populate('ownerImage', '_id path')
            .populate('petImages', '_id path');

        if (!patient) {
            return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "usernotfound"));
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), patient);
    } catch (error) {
        console.error("Error fetching patient by ID:", error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const updatePatientByStatus = async (req, res) => {
    try {
        const patientId = req.params.id;
        const { isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "invalidpatientid"));
        }

        let patient = await patientModel.findOne({ _id: patientId, isDeleted: false });
        if (!patient) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }

        patient.isActive = isActive;
        await patient.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), patient);
    } catch (error) {
        console.error("Error updating patient status:", error);
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
    profileUpdate,
    getPatientPagination,
    getPatientById,
    updatePatientByStatus,
    signupWeb,
    loginWeb,
    forgetWeb,
};
