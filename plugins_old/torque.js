const log = require("../utils/logger");

function addHandlers(server) {
    server.post("/api/torque/upload", (req, res, next) => {
        if (req.body) {
            log.debug("Torque Log: " + JSON.stringify(req.body));
            res.send(200, "OK!");
        }
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "torque obdii",
    start: (server) => {
        addHandlers(server);
    }
}
