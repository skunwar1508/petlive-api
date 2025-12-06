const express = require('express');
const verifyJWT = require('../../utils/jwt');
const inquiriesController = require('../../controllers/inquiry/inquiry.controller');

const router = express.Router();


router.post(
    '/create',
    inquiriesController.create
);

router.get(
    '/getAll',
    verifyJWT,
    inquiriesController.getAll
);

router.get(
    '/getById/:id',
    verifyJWT,
    inquiriesController.getOne
);

router.post(
    '/paginate',
    verifyJWT,
    inquiriesController.getPaginated
);

module.exports = router;