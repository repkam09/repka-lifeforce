const log = require("../utils/logger");

function addHandlers(server) {
    server.get("/api/github", (req, res, next) => {
        if (req.body) {
            var webhook = req.body;
            log.debug("Github Webhook: " + JSON.stringify(webhook));
            res.send(200);
        } else {
            res.send(400);
        }
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "github webhook",
    start: (server) => {
        addHandlers(server);
    }
}