const WalletTransaction = require('../../../models/wallet.transaction.model');
const Patient = require('../../../models/patient.model');
const apiResponse = require('../../../utils/apiResponse'); // Assuming apiResponse is imported
const CMS = require("../../../common-modules/index");
const Joi = require('joi');
const addWalletAmount = async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;
        const schema = Joi.object({
            amount: Joi.number().positive().required().messages({
                'number.base': 'Amount must be a number.',
                'number.positive': 'Amount must be a positive number.',
                'any.required': 'Amount is required.'
            }),
            paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'net_banking', 'upi', 'wallet').required().messages({
                'string.base': 'Payment method must be a string.',
                'any.only': 'Payment method must be one of [credit_card, debit_card, net_banking, upi, wallet].',
                'any.required': 'Payment method is required.'
            })
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return apiResponse.errorMessage(res, 400, error.details[0].message);
        }
        const patientId = req.doc.id;
        if (req.doc.role !== 'patient') {
            return apiResponse.errorMessage(res, 403, CMS.Lang_Messages("en", "unauthorized_access"));
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return apiResponse.errorMessage(res, 401, CMS.Lang_Messages("en", "patient_not_found"));
        }

        // Calculate GST and total
        const gstAmount = parseFloat((Number(amount) * 0.18).toFixed(2));
        const totalAmountPaid = Number(amount) + gstAmount;

        // Update wallet balance (only base amount gets credited)
        patient.walletBalance += Number(amount);
        await patient.save();

        
        // Create wallet transaction
        const transaction = new WalletTransaction({
            patientId,
            amount:Number(amount),
            gstAmount,
            totalAmountPaid,
            paymentMethod: paymentMethod, // Assuming paymentMethod is passed in the request body
            type: 'credit',
            purpose: 'top-up',
            status: 'success',
            settled: true, // Assuming the transaction is settled immediately
            settledAt: new Date()
        });

        await transaction.save();

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), transaction);
    } catch (error) {
        console.error('Error adding wallet amount with GST:', error);
        return apiResponse.errorMessage(res, 500, CMS.Lang_Messages("en", "server_error"), error.message);
    }
};

const getWalletTransactions = async (req, res) => {
    try {
        const patientId = req.doc.id;
        const transactions = await WalletTransaction.find({ patientId }).sort({ createdAt: -1 });

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), transactions);
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        return apiResponse.errorMessage(res, 500, CMS.Lang_Messages("en", "server_error"), error.message);
    }
};

module.exports = {
    addWalletAmount,
    getWalletTransactions
};