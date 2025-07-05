const Joi = require("joi");
const CMS = require("../../common-modules/index");
const apiResponse = require("../../utils/apiResponse");

// Validation for adding/updating a community
function addCommunityValidation(req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "*": `name ${CMS.Lang_Messages("en", "feildmissing")}`,
            }),
        image: Joi.string().required().messages({
            "*": `image ${CMS.Lang_Messages("en", "feildmissing")}`,
        }),
        description: Joi.string()
            .required()
            .messages({
                "*": `description ${CMS.Lang_Messages("en", "feildmissing")}`,
            }),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
    }
    next();
}


// Validation for community pagination
function communityPaginationValidation(req, res, next) {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        type: Joi.string().allow("", null),
        isEnabled: Joi.boolean().allow("", null),
        searchString: Joi.string().allow("", null),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
    }
    next();
}
// Validation for community pagination
function postPaginationValidation(req, res, next) {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        searchString: Joi.string().allow("", null),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
    }
    next();
}

// Validation for updating community status
function communityStatusValidation(req, res, next) {
    const schema = Joi.object({
        isEnabled: Joi.boolean().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
    }
    next();
}
function addPostValidation(req, res, next) {
    const schema = Joi.object({
        content: Joi.string().allow("", null),
        image: Joi.string().allow("", null),
        isAnonymouse: Joi.boolean().allow("", null),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
    }
    next();
}
// Validation for comment content
function commentValidation(req, res, next) {
    const schema = Joi.object({
        comment: Joi.string().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return apiResponse.validationErrorWithData(res, error.details[0].message)
    }
    next();
}
module.exports = {
    addCommunityValidation,
    communityPaginationValidation,
    communityStatusValidation,
    postPaginationValidation,
    addPostValidation,
    commentValidation
};
