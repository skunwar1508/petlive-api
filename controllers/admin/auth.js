const jwt = require("jsonwebtoken");
const CMS = require("../../common-modules/index");
const roles = require("../../utils/roles.js");
const adminModel = require("../../models/admin.model.js");
const bcrypt = require("bcryptjs");
const apiResponse = require("../../utils/apiResponse.js");

const adminLogin = async (req, res) => {
    try {
        let requestData = req.body
        let admin = await adminModel.findOne({ email: requestData.email }).select("+password");
        if (!admin) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "usernotfound"));
        }

        let verify = await bcrypt.compare(requestData.password, admin.password);
        if (!verify) {
            return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongpassword"));
        }

        let payLoad = {
            id: admin._id,
            role: roles.admin,
        };

        let token = jwt.sign(payLoad, process.env.LOGIN_KEY, {
            expiresIn: "24h", // expires in 1 Day
        });
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), token);
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

//====================================================
//====================================================


const changePassword = async (req, res) => {
    try {
        const role = req.doc.role
        let adminId = req.doc.id
        let requestData = req.body
        if (role === roles.admin) {
            if (requestData.password !== requestData.confirmPassword) {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "confirmpassword"));
            }

            let admin = await adminModel.findOne({ _id: adminId }).select("+password");
            if (admin) {
                let verify = await bcrypt.compare(
                    requestData.oldPassword,
                    admin.password
                );


                if (!verify) {
                    return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "wrongpassword"));
                }
                const salt = bcrypt.genSaltSync(10);
                let hash = await bcrypt.hash(requestData.password, salt);
                admin.password = hash;
                admin.save();
                return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"));
                // return { error: null, data: null };
            } else {
                return apiResponse.errorMessage(res, 400, CMS.Lang_Messages("en", "adminnotfound"));
            }
        } else {
            return apiResponse.unauthorizedMsg(res);
        }
    } catch (error) {
        console.log(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

//====================================================
//====================================================

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

module.exports = {
    adminLogin,
    changePassword,
    refreshToken
};
