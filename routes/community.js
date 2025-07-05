const express = require('express');
const router = express.Router();
const errorRes = require("../utils/error.js");
const verifyJWT = require('../utils/jwt.js');
const CMS = require("../common-modules/index");
const {
    addCommunity,
    getCommunity,
    getAllCommunity,
    updateCommunity,
    paginateCommunity,
    statusupdate,
    deleteCommunity
} = require("../controllers/community/community.controller.js")

/**
 * @function  Add_Community
 * @description POST /api/v1/community/create
 */

router.post("/create", verifyJWT, async (req, res) => {
    try {
        const { error, data } = await addCommunity(req.doc.id, req.body, req.doc.role);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "addCommunity"),
            data,
        });
    } catch (error) {
        console.log(error)
        // console.error(error);
        return res.status(500).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
});

/**
 * @function  Get_Community
 * @description GET /api/v1/community/:id
 */

router.get("/:id", async (req, res) => {
    try {
        let { error, data } = await getCommunity(req.params.id, req.doc.role);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "success"),
            data,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
});

/**
 * @function  GetAll_Community
 * @description GET /api/v1/community/get/:id
 */

router.get("/getall", async (req, res) => {
    try {
        let { error, data } = await getAllCommunity(req.doc.role);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "success"),
            data,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
});



/**
 * @function  Edit_Community
 * @description POST /api/v1/community/update/:id
 */

router.post("/update/:id", async (req, res) => {
    try {
        let { error, data } = await updateCommunity(req.params.id, req.body, req.doc.role);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "success"),
            data,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
});


/**
 * @function  Community_Paginate
 * @description POST /api/v1/community/paginate/
 */

router.post("/paginate", async (req, res) => {
    try {
        let { error, data } = await paginateCommunity(req.body, req.doc.id);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "success"),
            ...data,
        });
    } catch (error) {
        console.error(error);
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
})

/**
 * @function  Update_status
 * @description POST /api/v1/community/status/:id
 */

router.post("/status/:id", async (req, res) => {
    try {
        let { error, data } = await statusupdate(req.params.id, req.body, req.doc.role);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "statusupdated"),
            data,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
});


/**
 * @function  Delete
 * @description DELETE /api/v1/community/:id
 */

router.delete("/:id", async (req, res) => {
    try {
        let { error, data } = await deleteCommunity(req.params.id, req.doc.role);
        if (error) {
            return errorRes(error, res);
        }
        return res.status(200).json({
            message: CMS.Lang_Messages("en", "dataDeleted"),
            data,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: CMS.Lang_Messages("en", "somethingwentwrong"),
        });
    }
});

module.exports = router
