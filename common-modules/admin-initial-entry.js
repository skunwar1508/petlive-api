const Admin = require("../models/admin.model");
const bcrypt = require("bcryptjs");

async function AdminInitialEntry() {
    let adminEntry = await Admin.findOne({
        email: 'admin@gmail.com'
    });
    if (!adminEntry) {
        const salt = bcrypt.genSaltSync(10);
        let hash = await bcrypt.hash('admin@123', salt)
        let newEntry = new Admin();
        newEntry.email = "admin@gmail.com";
        newEntry.email.toLowerCase();
        newEntry.password = hash
        newEntry.name = "Admin";
        newEntry.phone = 9999999999;
        newEntry.role = "ADMIN";
        newEntry.enabled = true;
        console.log("Initial Admin Entry Created");
        await newEntry.save()
    }
}
AdminInitialEntry();

