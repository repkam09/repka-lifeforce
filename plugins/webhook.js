const log = require("../utils/logger");
const config = require("../config.json");

function addHandlers(server) {
    server.post("/api/github", (req, res, next) => {
        if (req.body) {
            var webhook = req.body;
            if (webhook.repository && webhook.commits && webhook.head_commit) {
                var repository = webhook.repository;
                var head = req.body.head_commit;

                log.info("Repository " + repository.name + " has been updated by " + head.author.name + " with message: " + head.message);
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