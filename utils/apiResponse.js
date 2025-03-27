
const successResponse = async (res, msg, data) => {
    var resData = {
        status: true,
        message: msg,
        data: data,
    };
    return res.status(200).json(resData);
}

// ==========================================================================
// ==========================================================================

const successResWithPagination = async (res, msg, data, totalCount) => {
    var resData = {
        status: true,
        message: msg,
        data: data,
        totalCount: totalCount,
    };
    return res.status(200).json(resData);
}

// ==========================================================================
// ==========================================================================

const successResponseWithCreated = async (res, msg, data) => {
    var resData = {
        status: true,
        message: msg,
        data: data,
    };
    return res.status(201).json(resData);
}

// ==========================================================================
// ==========================================================================

const validationErrorWithData = async (res, msg) => {
    var resData = {
        status: false,
        message: msg,
        data: null,
        // message: null
    };
    return res.status(400).json(resData);
}

// ==========================================================================
// ==========================================================================

const errorMessage = async (res, statusCode, msg) => {
    return res.status(statusCode).json({
        status: false,
        message: msg,
        data: null,
        // message:msg
    })
}

// ==========================================================================
// ==========================================================================

const somethingWentWrongMsg = async (res) => {
    return res.status(400).json({
        status: false,
        message: "Something went wrong",
        data: null,
    })
}

// ==========================================================================
// ==========================================================================

const unauthorizedMsg = async (res) => {
    var resData = {
        status: false,
        data: null,
        message: "Unauthorized access!",
    };
    return res.status(401).json(resData);
}

// ==========================================================================
// ==========================================================================

const dataNotFound = async (res) => {
    var resData = {
        status: false,
        data: null,
        message: "Data not found!",
    };
    return res.status(200).json(resData);
}

module.exports = {
    successResponse,
    successResWithPagination,
    successResponseWithCreated,
    validationErrorWithData,
    errorMessage,
    somethingWentWrongMsg,
    unauthorizedMsg,
    dataNotFound
}
