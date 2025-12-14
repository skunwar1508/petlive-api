const express = require('express');
const { paginate, create, update, getById, getTopFeatured, getBySlug } = require('../../controllers/blogs/blog.controller');
const verifyJWT = require('../../utils/jwt');
const router = express.Router();

router.post('/paginate', paginate);
router.get('/top-featured', getTopFeatured);
router.get('/get/:id', getById);
router.get('/get-by-slug/:slug', getBySlug);
router.post('/create', verifyJWT, create);
router.post('/update/:id', verifyJWT, update);

router.use('/category', require('./blog.category.js'));



module.exports = router;