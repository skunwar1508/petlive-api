const jwt = require('jsonwebtoken');
// const vendorModel = require("../models/vendor.model");
// const customerModel = require("../models/customer.model");

const verifyJWT = (req, res, next) => {
    try {
        var token =
            req.headers?.authorization?.split("Bearer ")[1] || req.body.token || req.query.token || req.headers["x-access-token"];

        if (token) {
            jwt.verify(token, process.env.LOGIN_KEY, function(err, _) {
                if (err) {
                    console.log(err)
                    return res.status(401).json({
                        message: "Fail to authenticate token."
                    });
                } else {
                    let decoded = jwt.decode(token, { complete: true });
                    req.doc = decoded.payload;
                    next();
                }
            });
        } else {
            return res.status(401).send({
                message: "No token provided."
            });
        }
    } catch (e) {
        console.log(e)
    }
}

module.exports = verifyJWT;

