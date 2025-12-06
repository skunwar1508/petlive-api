const express = require('express');

const adminRouter = require('./admin/admin.index.js');
const doctorRouter = require('./doctor/doctor.index.js');
const patientRouter = require('./patient/patient.index.js');

const router = express.Router();
// blog 
router.use('/blog', require('../routes/blogs/blog.index.js'));

router.use('/admin', adminRouter);
router.use('/doctor', doctorRouter);
router.use('/patient', patientRouter);

router.use("/media", require("./media/media.download.route.js"));
router.use("/category", require("./category/category.index.js"));
router.use("/subcategory", require("./subcategory/subcategory.index.js"));
router.use("/breadColor", require("./breadColor/breadColor.index.js"));
router.use("/services", require("./services/services.routes.js"));
router.use("/community", require("../routes/community/community.route.js"));
router.use("/request", require("../routes/socket/socket.routes.js"));
router.use("/contact", require("../routes/contact/contact.index.js"));
router.use("/inquiry", require("../routes/inquiry/inquiry.index.js"));

module.exports = router;