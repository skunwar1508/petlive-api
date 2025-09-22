const express = require('express');
const { paginate, create, update, getById } = require('../../controllers/blogs/blog.controller');
const router = express.Router();

router.post('/paginate', paginate);
router.post('/create', create);
router.post('/update/:id', update);
router.get('/get/:id', getById);



module.exports = router;