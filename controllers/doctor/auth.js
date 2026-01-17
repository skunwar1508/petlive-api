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

        let doctor = await doctorModel.findOne({ email: requestData.email.toLowerCase(), isDeleted: false });
        if (!doctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }
        if (doctor.approveProfile === "Rejected") {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "profileRejected"));
        }
        if (doctor.approveProfile === "Pending") {
            if (doctor.isProfileCompleted) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "profilePending"));
            } else {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "completeProfilePendingApproval"), doctor);
            }
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
                let doctor = await doctorModel.findOne({ email: requestData.email.toLowerCase(), isDeleted: false, approveProfile: { $ne: "Rejected" } }).select("-password");
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
            approveProfile: { $ne: "Rejected" },
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
            approveProfile: { $ne: "Rejected" }
        });

        if (existingDoctor) {
            if (existingDoctor?.isProfileCompleted) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "userexistemail"));
            }
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
            lastStep: 1
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.profileImage = requestData.profileImage;
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 2;
        }
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.gender = requestData.gender;
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 3;
        }
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.dob = requestData.dob;
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 4;
        }
        // doctor.isProfileCompleted = true;
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.experience = requestData.experience;
        doctor.registrationNo = requestData.registrationNo;
        doctor.licenceImage = requestData.licenceImage;
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 5;
        };
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.animalPreference = requestData.animalPreference;
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 6;
        }
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.primarySpecialisation = requestData.primarySpecialisation;
        doctor.otherSpecialisation = requestData.otherSpecialisation;
        doctor.services = requestData.services; // expects array or object of services
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 7;
        }
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
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.bio = requestData.bio;
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 8;
        }
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const signupStep8 = async (req, res) => {
    // update services
    try {
        const requestData = req.body;
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false, approveProfile: { $ne: "Rejected" } });
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        doctor.services = requestData.services; // expects array or object of services
        if (!doctor?.isProfileCompleted) {
            doctor.lastStep = 9;
        }
        doctor.isProfileCompleted = true;
        await doctor.save();
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

// ==========================================================================
const getProfile = async (req, res) => {
    try {
        let doctor = await doctorModel.findOne({ _id: req.doc.id, isDeleted: false }).select("-password").populate(["profileImage", "licenceImage", "services"]);
        if (!doctor) return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
// ==========================================================================

const pagination = async (req, res) => {
    try {
        const { page = 1, perPage = 10, searchString = "", filters } = req.body;
        const pageNumber = parseInt(page);
        const limit = parseInt(perPage);
        const skip = (pageNumber - 1) * limit;

        // Query filters
        const filter = { isDeleted: false };
        // If the user is a doctor, apply additional filters
        if (req.doc && req.doc.role === roles.doctor) {
            filter.isProfileCompleted = true;
            filter.approveProfile = "approved";
        }
        // Add search functionality if searchString is provided
        if (searchString) {
            filter.$or = [
                { name: { $regex: searchString, $options: 'i' } },
                { email: { $regex: searchString, $options: 'i' } },
                { doctorId: { $regex: searchString, $options: 'i' } },
                { bio: { $regex: searchString, $options: 'i' } }
            ];
        }

        if (filters) {
            const { profileStatus, verificationStatus } = filters;
            if (profileStatus !== undefined) {
                filter.isActive = profileStatus;
            }
            if (verificationStatus !== undefined) {
                filter.approveProfile = verificationStatus;
            }
        }
        console.log("Filter:", filter);
        // Total count for pagination
        const totalDoctors = await doctorModel.countDocuments(filter);

        // Get doctors with pagination
        const doctors = await doctorModel.find(filter)
            .select("-password")
            .populate(["profileImage", "licenceImage"])
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });


        return apiResponse.successResWithPagination(res, CMS.Lang_Messages("en", "success"), doctors, totalDoctors);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getDoctorDetails = async (req, res) => {
    try {
        // Check if user is admin
        if (req.doc.role === roles.admin || req.doc.role === roles.patient) {

            const doctorId = req.params.doctorId;

            if (!doctorId) {
                return apiResponse.validationErrorWithData(res, "Doctor ID is required");
            }

            let doctor = await doctorModel.findOne({
                _id: doctorId,
                isDeleted: false,
            }).select("-password").populate(["profileImage", "licenceImage"]);

            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
        } else {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const changeStatus = async (req, res) => {
    try {
        // Only admin can change status
        if (req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        const { doctorId } = req.params;
        const { status } = req.body;

        if (!status) {
            return apiResponse.validationErrorWithData(res, "Status is required");
        }


        if (!doctorId) {
            return apiResponse.validationErrorWithData(res, "Doctor ID is required");
        }

        // Validate status value
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return apiResponse.validationErrorWithData(res, "Invalid status value. Status must be approved, pending, or rejected");
        }
        // If status is 'Rejected', also mark doctor as deleted
        let updateFields = { approveProfile: status };
        if (status.toLowerCase() === 'rejected') {
            updateFields.isDeleted = true;
        }

        // Find and update the doctor
        const doctor = await doctorModel.findOneAndUpdate(
            { _id: doctorId, isDeleted: false },
            updateFields,
            { new: true }
        ).select("-password");

        if (!doctor) {
            return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "usernotfound"));
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};
const profileStatusUpdate = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { isActive } = req.body;
        if (req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        if (!doctorId) {
            return apiResponse.validationErrorWithData(res, "Doctor ID is required");
        }
        if (typeof isActive !== 'boolean') {
            return apiResponse.validationErrorWithData(res, "isActive must be a boolean value");
        }

        // Find and update the doctor's profile status
        const doctor = await doctorModel.findOneAndUpdate(
            { _id: doctorId, isDeleted: false },
            { isActive: isActive },
            { new: true }
        ).select("-password");

        if (!doctor) {
            return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "usernotfound"));
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const consultationFeeUpdate = async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.doc.role !== roles.doctor) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        const { consultationFee } = req.body;


        // Find and update the doctor
        const doctor = await doctorModel.findOneAndUpdate(
            { _id: req.doc.id, isDeleted: false },
            { consultationFee: consultationFee },
            { new: true }
        ).select("-password");

        if (!doctor) {
            return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "usernotfound"));
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const updateDoctorProfile = async (req, res) => {
    try {
        let doctorId;
        // If admin, get doctorId from params; if doctor, get from token
        if (req.doc.role === roles.admin) {
            doctorId = req.params.doctorId;
        } else if (req.doc.role === roles.doctor) {
            doctorId = req.doc.id;
        } else {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        const updateData = req.body;

        if (!doctorId) {
            return apiResponse.validationErrorWithData(res, "Doctor ID is required");
        }

        // Prevent updating password via this API
        if (updateData.password) {
            delete updateData.password;
        }

        const doctor = await doctorModel.findOneAndUpdate(
            { _id: doctorId, isDeleted: false },
            updateData,
            { new: true }
        ).select("-password");

        if (!doctor) {
            return apiResponse.errorMessage(res, 404, CMS.Lang_Messages("en", "usernotfound"));
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), doctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const doctorCreate = async (req, res) => {
    try {
        const doctorData = req.body;
        if (req.doc.role !== roles.admin) {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        if (!doctorData.name || !doctorData.dob) {
            return apiResponse.validationErrorWithData(res, "Name and DOB are required to generate default password");
        }
        const year = doctorData.dob.split('-')[0];
        const defaultPassword = `${doctorData.name.replace(/\s+/g, '').toLowerCase()}@${year}`;
        console.log("Default Password:", defaultPassword);
        doctorData.password = await bcrypt.hash(defaultPassword, 10);

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), newDoctor);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return apiResponse.validationErrorWithData(res, "Email is required");
        }
        const doctor = await doctorModel.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (!doctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }
        const otpCode = Math.floor(100000 + Math.random() * 9000);
        const newOtp = new otpModel({
            otp: otpCode,
            email: email.toLowerCase(),
            usedFor: "FORGOT_PASSWORD",
        });
        await newOtp.save();
        if (process.env.MODE === "development") {
            return apiResponse.successResponse(res, `An OTP ${otpCode} has been sent to your email ${email}`, { otp: otpCode });
        } else {
            // Add logic to send OTP via email service
            return apiResponse.successResponse(res, CMS.Lang_Messages("en", "otpsentemail"));
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp, password, confirmPassword } = req.body;
        if (!email || !otp || !password || !confirmPassword) {
            return apiResponse.validationErrorWithData(res, "Email, OTP, password and confirm password are required");
        }
        if (password !== confirmPassword) {
            return apiResponse.validationErrorWithData(res, "Password and confirm password do not match");
        }
        const otpRecord = await otpModel.find({ email: email.toLowerCase(), usedFor: "FORGOT_PASSWORD" }).sort({ createdAt: -1 }).limit(1);
        if (otpRecord.length === 0) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "otpexprire"));
        }
        if (Number(otpRecord[0].otp) !== Number(otp)) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongotp"));
        }
        const doctor = await doctorModel.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (!doctor) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }
        doctor.password = await bcrypt.hash(password, 10);
        await doctor.save();
        await otpModel.deleteOne({ _id: otpRecord[0]._id });
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "passwordreset"), { email: doctor.email });
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

module.exports = {
    login,
    signup,
    resendOTP,
    doctorCreate,
    verifySignUpOTP,
    signupStep1,
    signupStep2,
    signupStep3,
    signupStep4,
    signupStep5,
    signupStep6,
    signupStep7,
    signupStep8,
    getProfile,
    pagination,
    getDoctorDetails,
    changeStatus,
    consultationFeeUpdate,
    updateDoctorProfile,
    profileStatusUpdate,
    forgotPassword,
    verifyForgotPasswordOTP
};
