const express = require('express');
const Joi = require('joi');
const Flag = require('../../models/community.flag'); // Adjust the path to your models
const roles = require('../../utils/roles');
const CMS = require("../../common-modules/index");
const apiResponses = require("../../utils/apiResponse.js");

// Validation schema for flagging a post review
const flagSchema = Joi.object({
    communityId: Joi.string().required(),
    communityPostId: Joi.string().required(),
    reason: Joi.string().min(3).max(255).required()
});

// Add flag to a post review
async function addFlag(req, res) {
    const { reason, communityId, communityPostId } = req.body;
    const flaggedByRole = req.doc.role; // Assuming req.doc contains user information
    const flaggedBy = req.doc.id; // Assuming req.doc contains user information

    // Validate request body
    const { error } = flagSchema.validate({
        reason,
        communityId,
        communityPostId
    });
    if (error) {
        return apiResponses.errorMessage(res, 400, error.details[0].message);
    }

    try {
        // Check if the user has already flagged the same post
        const existingFlag = await Flag.findOne({
            communityId,
            communityPostId,
            flaggedBy,
        });

        if (existingFlag) {
            // Update the reason if the flag already exists
            existingFlag.reason = reason;
            await existingFlag.save();
            return apiResponses.successResponse(res, 'Flag reason updated successfully', existingFlag);
        }

        // Add the flag to the database
        const newFlag = await Flag.create({
            reason,
            communityId,
            communityPostId,
            flaggedBy,
            flaggedByRole
        });

        return apiResponses.successResponse(res, 'Flag added successfully', newFlag);
    } catch (error) {
        console.error('Error adding flag:', error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

async function paginateFlag(req, res) {
    if (req.doc.role !== roles.admin) {
        return res.status(403).json({ error: 'Access denied' });
    }
    const error = paginateValidator(req.body);
    if (error) {
        return apiResponses.errorMessage(res, 400, error.details[0].message);
    }

    try {
        let startIndex = (req.body.page - 1) * req.body.perPage;
        let perPage = parseInt(req.body.perPage);
        skipCondition = {
            skip: startIndex,
            limit: perPage,
            sort: { createdAt: -1 },
        };

        const con={};

        if (req.body.searchString) {
            con["$or"] = [
            {
                reason: { $regex: ".*" + req.body.searchString + ".*", $options: "i" }
            }
            ];
        }

        // Filters
        if (Object.keys(req.body).includes("filters")) {
            if (Object.keys(req.body.filters).includes("communityId")) {
                con.communityId = req.body.filters.communityId;
            }
            if (Object.keys(req.body.filters).includes("communityPostId")) {
                con.communityPostId = req.body.filters.communityPostId;
            }
            if (Object.keys(req.body.filters).includes("flaggedBy")) {
                con.flaggedBy = req.body.filters.flaggedBy;
            }
            if (Object.keys(req.body.filters).includes("flaggedByRole")) {
                con.flaggedByRole = req.body.filters.flaggedByRole;
            }
        }

        let doc = await Flag.find(con, {}, skipCondition).populate([
            { path: "communityId" },
            { path: "communityPostId", populate: { path: "author" } },
            { path: "flaggedBy" }
        ]);
        let totalCount = await Flag.countDocuments(con, {});
        return apiResponses.successResWithPagination(res, `Flag ${CMS.Lang_Messages("en", "success")}`, doc, totalCount);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }

}
function paginateValidator(paginateData) {
    let validator = Joi.object({
        page: Joi.number()
            .required()
            .messages({
                "*": `page ${CMS.Lang_Messages("en", "feildmissing")}`,
            }),
        perPage: Joi.number()
            .required()
            .messages({
                "*": `perPage ${CMS.Lang_Messages("en", "feildmissing")}`,
            }),
        filters: Joi.object().optional(),
        searchString: Joi.string().allow("", null),
    });

    let { error } = validator.validate(paginateData, { convert: true });

    if (error) {
        return error;
    }
}
module.exports = {
    addFlag,
    paginateFlag
};