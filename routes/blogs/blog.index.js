const express = require('express');
const { paginate, create, update, getById, getTopFeatured } = require('../../controllers/blogs/blog.controller');
const verifyJWT = require('../../utils/jwt');
const router = express.Router();

router.post('/paginate', paginate);
router.get('/top-featured', getTopFeatured);
router.get('/get/:id', getById);
router.post('/create', verifyJWT, create);
router.post('/update/:id', verifyJWT, update);



module.exports = router;