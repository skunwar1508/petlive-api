const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const server = require('http').Server(app);
mongoose.set('strictQuery', true);
const Admin = require("./models/admin.model");
const bcrypt = require("bcryptjs");
const apiResponse = require("./utils/apiResponse.js");

const fs = require("fs");
const { start } = require("./utils/cronJob.js");
if (!fs.existsSync(path.join(__dirname, "/uploads"))) {
    fs.mkdirSync(path.join(__dirname, "/uploads"))
}
require('dotenv').config();

// mongodb connection
if (!process.env.MONGO_URI) {
    throw new Error("MONGO URL IS MISSING FROM ENV ");
}

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to the database...")).catch((err) => console.log("Cannot connect to the database!!", err));

const io = require("socket.io")(server);
require("./socket.js")(io);
start({ intervalMinutes: 60, thresholdHours: 12 });

// extra middle-wares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors({
    origin: '*'
}));

app.use(express.static(__dirname + "/public"));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);

const logger = (req, res, next) => {
    console.log("Request: ", req.method, req.url);
    next();
};

app.use("/api/v1/", logger, require("./routes/index.js"));

app.get("/health", (_req, res) => {
    // return apiResponse.successResponse(res, "Server is running", {});
    let git = require("git-rev-sync");
    let pjson = require("./package.json");
    console.log(git);
    res.status(200).json({
        project: pjson.name,
        running: true,
        version: pjson.version,
        branch: git.branch(),
        head: git.short(),
        "head-long": git.long(),
        date: git.date(),
        repoName: git.remoteUrl().split("/")[4].split(".")[0],
        mode: process.env.MODE,
    });
});

app.get("/version", (_req, res) => {
    res.status(200).json({
        project: "LATE-DEC-24",
        running: true,
        version: "LATE-DEC-24",
        mode: process.env.MODE,
    });
});


async function AdminInitialEntry() {
    let adminEntry = await Admin.findOne({
        email: 'admin@gmail.com'
    });
    if (!adminEntry) {
        const salt = bcrypt.genSaltSync(10);
        let hash = await bcrypt.hash(process.env.ADMIN_INI_PWD, salt)
        let newEntry = new Admin();
        newEntry.email = "admin@gmail.com";
        newEntry.email.toLowerCase();
        newEntry.password = hash
        newEntry.name = "admin";
        newEntry.phone = 9999999999;
        newEntry.role = "ADMIN";
        newEntry.enabled = true;
        console.log("Initial Admin Entry Created");
        await newEntry.save()
    }
}
AdminInitialEntry();

server.listen(process.env.PORT, () => console.log(process.env.PORT + " is the magic port"));

