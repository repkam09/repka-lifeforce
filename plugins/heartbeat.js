const log = require("../utils/logger");

function addHandlers(server) {
    // Set up the lifeforce heartbeat listener
    server.get("/api/lifeforce/heartbeat/:appname", (req, res, next) => {
        if (req.params.appname) {
            log.debug("Heartbeat from " + req.params.appname);
            res.send(200);
        } else {
            res.send(400, "Please supply an application name");
        }
    });
}


/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "heartbeat",
    start: (server) => {
        addHandlers(server);
    }
}
