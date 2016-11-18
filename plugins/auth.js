const log = require("../utils/logger");
const restify = require('restify');

var authlist = [
    "getapilifeforceheartbeatappname110"
]

function addHandlers(server) {
    server.use(function authenticate(req, res, next) {
        if (authlist.indexOf(req._currentRoute) != -1) {
            log.info("Authentication Required: " + req.url);
            //return next(new restify.NotAuthorizedError());
        } else {
            log.info("No authentication required for " + req.url);
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