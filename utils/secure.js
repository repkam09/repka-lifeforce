const log = require("./logger.js")
const config = require("../config.json");

const usermap = new Map();

usermap.set("example", { password: "example" });

function hasSecureHeader(req, res) {
    if (req.headers['repka-verify']) {
        log.info("hasSecureHeader has passed");
        return true;
    } else {
        log.info("hasSecureHeader has failed - returning 401 unauth");
        res.send(401, "Secure Verificiation Failed");
        return false;
    }
}

function isValidUser(username, password) {
    if (usermap.has(username)) {
        if (usermap.get(username).password === password) {
            return true;
        }
    }

    return false;
}

function registerUser(key, value) {
    usermap.set(key, value);
}

function updateUser(key, value) {
    usermap.set(key, value);
}

function getUser(key) {
    return usermap.get(key);
}

function userExists(key) {
    return usermap.has(key);
}

function isLoggedIn(req, res) {
    const authobj = req.authorization;
    if (authobj.basic) {
        let pass = authobj.basic.password;
        let user = authobj.basic.username;
        return isValidUser(user, pass);
    } else {
        return false;
    }
}

module.exports = { hasSecureHeader, isLoggedIn, registerUser, updateUser, getUser }