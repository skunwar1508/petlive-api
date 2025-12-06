const express = require('express');
const verifyJWT = require('../../utils/jwt');
const contactController = require('../../controllers/contact/contact.controller');

const router = express.Router();


router.post(
    '/create',
    contactController.create
);

router.get(
    '/getAll',
    verifyJWT,
    contactController.getAll
);

router.get(
    '/getById/:id',
    verifyJWT,
    contactController.getOne
);

router.post(
    '/paginate',
    verifyJWT,
    contactController.getPaginated
);

module.exports = router;