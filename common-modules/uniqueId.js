// const customerModel = require('../models/customer.model');
const vendorModel = require("../models/owner.model");

const startingCount = 10000;

module.exports = async () => startingCount  + await vendorModel.countDocuments();
// module.exports = async () => startingCount + await customerModel.countDocuments() + await vendorModel.countDocuments();

