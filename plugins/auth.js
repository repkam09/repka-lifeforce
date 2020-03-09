const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const secure = require("../utils/secure.js");

class UserAuth extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/auth/signup",
                type: "post",
                handler: handleUserCreate
            },
            {
                path: "/api/auth/login",
                type: "post",
                handler: handleUserLogin
            },
            {
                path: "/api/auth/logout",
                type: "post",
                handler: handleUserLogout
            },
            {
                path: "/api/auth/test",
                type: "get",
                handler: handleUserTest
            },
        ];
    }
}

function handleUserTest(req, res, next) {
    if (this.isLoggedIn(req, res)) {
        res.send(200, createResponse(false, "you are logged in!"));
    } else {
        res.send(200, createResponse(false, "you are not logged in"));
    }
}

function handleUserCreate(req, res, next) {
    if (hasProperties(req.body, ['username', 'password'])) {

        if (secure.userExists(req.body.username)) {
            res.send(200, createResponse(true, "user already exists"));
            return next();
        }

        const user = { username: req.body.username, password: req.body.password, create: Date.now(), ipaddr: getIPAddr(req) };
        secure.registerUser(req.body.username, user);
        res.send(200, createResponse(false, "user created"));
    } else {
        res.send(200, createResponse(true, "missing required property"));
    }
    return next();
}

function handleUserLogin(req, res, next) {
    if (hasProperties(req.body, ['username', 'password'])) {
        if (users.has(req.body.username)) {
            if (req.body.password === users.get(req.body.username).password) {

                let tbuff = new Buffer.from(req.body.username + ":" + req.body.password, 'utf8');
                let token = tbuff.toString('base64');

                res.send(200, createResponse(false, "logged in", token));
            } else {
                res.send(200, createResponse(true, "auth failed"));
            }
            return next();
        }

        res.send(200, createResponse(true, "user does not exist"));
    } else {
        res.send(200, createResponse(true, "missing required property"));
    }
    return next();
}

function handleUserLogout(req, res, next) {
    if (secure.isLoggedIn(req, res)) {
        res.send(200, createResponse(false, "logged out", null));
    } else {
        res.send(200, createResponse(false, "not logged in", null));
    }
    return next();
}


function getIPAddr(req) {
    let clientip = "unknown";
    if (req.headers["x-forwarded-for"]) {
        clientip = req.headers["x-forwarded-for"];
    } else if (req.connection.remoteAddress) {
        clientip = req.connection.remoteAddress;
    }

    return clientip;
}

function hasProperties(obj, proplist) {

    if (!obj) {
        return false;
    }

    if (typeof obj == "undefined") {
        return false;
    }

    let hasAllProperties = true;
    proplist.forEach((prop) => {
        if (!obj.hasOwnProperty(prop)) {
            hasAllProperties = false;
        }
    });

    return hasAllProperties;
}

function createResponse(error, status, token = null) {
    return { error, status, token };
}

module.exports = UserAuth;
