module.exports = {
    days: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'],
    randomizer: function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 6; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    emailvalidator: function (email) {
        const emailRegexp =  /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return emailRegexp.test(email);
        // return true
    },
    dateformat: function (date) {
        // const dateRegexp = /(\d{4}-\d{2}-\d{2})[A-Z]+(\d{2}:\d{2}:\d{2}).([0-9+-:]+)/;  // 1
        const dateRegexp = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;  // 2 with time zne
        return dateRegexp.test(date);
    },

    phonenumbervalidatorbrazil: function (number) {
        const phonenumber = /^\d{11}$/;
        return phonenumber.test(number);
    },
    phonenumbervalidator: function (number) {
        const phonenumber = /^\d{10}$/;
        return phonenumber.test(number);
    },
    passwordvalidator: function (password) {
        // const passwordenter = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
        const passwordenter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
        return passwordenter.test(password);
    },
    passwordMatch: function (password, confirmPassword) {
        if (password === confirmPassword) {
            return true;
        }
        else {
            return false;
        }

    },
    randomizernumber: function () {
        var text = "";
        var possible = "0123456789";
        for (var i = 0; i < 4; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    userLastActive: function (userId) {
        const User = require('../models/customer.model')
        User.updateOne({
            _id: userId
        }, {
            $set: {
                lastActive: new Date()
            }
        }, (err, doc) => { });
    },
}
