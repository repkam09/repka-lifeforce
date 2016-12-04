const log = require("../utils/logger");
const restify = require('restify');
const config = require("../config.json");

var authlist = [
]

function addHandlers(server) {
    server.use(function authenticate(req, res, next) {
        if (authlist.indexOf(req._currentRoute) != -1) {
            // Get the username and password that were passed in with the auth request

            let authinfo = req.authorization;
            if (authinfo.scheme === "Basic") {
                let authlist = config.authlist;

                // Get the username and password that were supplied
                let suppliedusername = authinfo.basic.username;
                let suppliedpassword = authinfo.basic.password;

                // Check if the supplied username exists in the known users list
                if (authlist[suppliedusername]) {
                    let correctpass = authlist[suppliedusername];
                    log.verbose("Authentication attempt using username " + suppliedusername);
                    if (suppliedpassword === correctpass) {
                        // Forward this request on, the user is allowed
                        return next();
                    } else {
                        // The username exists, but the password is incorrect
                        return next(new restify.NotAuthorizedError());
                    }
                } else {
                    // The username specified does not exist in the list
                    return next(new restify.NotAuthorizedError());
                }
            } else {
                // The wrong auth scheme was supplied
                return next(new restify.NotAuthorizedError());
            }
        }
        return next();
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "authenticate",
    start: (server) => {
        addHandlers(server);
    }
}