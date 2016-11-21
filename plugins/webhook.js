const log = require("../utils/logger");
const config = require("../config.json");

function addHandlers(server) {
    server.post("/api/github", (req, res, next) => {
        if (req.body) {
            var webhook = req.body;
            log.verbose("RAW Webhook: " + JSON.stringify(webhook));

            var hookid = webhook.hook_id;
            if (webhook.hook_id) {
                log.debug(hookid + ": " + webhook.zen);
                log.debug(hookid + ": " + webhook.repository.name);
                log.debug(hookid + ": " + webhook.sender.login);
            }
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