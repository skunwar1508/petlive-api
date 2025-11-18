const express = require('express');
const {
    paginate,
    getById,
    create,
    update,
    getAll,
    enableDisable,
    remove
} = require('../../controllers/blogs/blog.category.controller');
const verifyJWT = require('../../utils/jwt');
const router = express.Router();

router.post('/paginate', paginate);
router.get('/', getAll);
router.get('/get/:id', getById);
router.post('/create', verifyJWT, create);
router.post('/update/:id', verifyJWT, update);
router.post('/enable-disable/:id', verifyJWT, enableDisable);
router.delete('/remove/:id', verifyJWT, remove);

module.exports = router;