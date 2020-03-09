const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

const users = new Map();

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
        ];
    }
}

function handleUserCreate(req, res, next) {
    if (hasProperties(req.body, ['username', 'password'])) {

        if (users.has(req.body.username)) {
            res.send(200, createResponse(true, "user already exists"));
            return next();
        }

        const user = { username: req.body.username, password: req.body.password, create: Date.now(), ipaddr: getIPAddr(req) };
        users.set(req.body.username, user);
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
                res.send(200, createResponse(false, "logged in", "supersecretkey"));
                userUpdateToken(req.body.username, "supersecretkey")
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
    if (hasProperties(req.body, ['username', 'token'])) {
        if (users.has(req.body.username)) {
            if (req.body.token === users.get(req.body.username).token) {
                res.send(200, createResponse(false, "logged out", null));
                userUpdateToken(req.body.username, null);
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

function userUpdateToken(username, token) {
    const currentuser = users.get(username);
    const tempuser = Object.assign({}, currentuser, { token: "supersecretkey" })
    users.set(username, tempuser);
}

module.exports = UserAuth;
