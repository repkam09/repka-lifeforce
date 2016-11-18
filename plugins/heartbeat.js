const log = require("../utils/logger");

var applist = [];

function addHandlers(server) {
    // Set up the lifeforce heartbeat listener
    server.get("/api/lifeforce/heartbeat/:appname", (req, res, next) => {
        if (req.params.appname) {
            var timestamp = new Date().getTime();
            log.debug("Heartbeat from " + req.params.appname + " at " + Date(timestamp.toLocaleString()));
            res.send(200, "OK");
            applist[req.params.appname] = timestamp;
        } else {
            res.send(400, "Please supply an application name");
        }
    });

    server.get("/api/lifeforce/heartbeat/:appname/last", (req, res, next) => {
        if (req.params.appname) {
            if (applist.hasOwnProperty(req.params.appname)) {
                res.send(200, applist[req.params.appname]);
            } else {
                res.send(400, 0);
            }
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
