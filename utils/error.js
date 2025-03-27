module.exports = function (error, res) {
    if (error === 401) {
        return res.status(401).send("Unauthorized");
    }
    return res.status(400).json({message: error, status :false})
}

