const log = require("../utils/logger");
const config = require("../config.json");
const exec = require('child_process').exec;

// Grab the webhook settings from the config json
const updaters = config.webhooks;

function addHandlers(server) {
    server.post("/api/github", (req, res, next) => {
        if (req.body) {
            var webhook = req.body;
            if (webhook.repository && webhook.commits && webhook.head_commit) {
                var repository = webhook.repository;
                var head = req.body.head_commit;

                log.info("Repository " + repository.name + " has been updated by " + head.author.name + " with message: " + head.message);
                if (updaters[repository.name]) {
                    var settings = updaters[repository.name];
                    log.info("Triggering redeploy for " + repository.name + " located at " + settings.path + " with script " + settings.script);
                    try {
                        exec(settings.path + "/" + settings.script, { cwd: settings.path }, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`exec error: ${error}`);
                                return;
                            }
                            // Log these to the console only, not to log files
                            console.log(`stdout: ${stdout}`);
                            console.log(`stderr: ${stderr}`);
                        });
                    } catch (error) {
                        log.error("An error occurred while running redeploy script for " + repository.name);
                    }
                }
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
