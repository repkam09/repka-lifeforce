const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const exec = require('child_process').exec;

let log = null;

class Webhook extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/github",
                type: "post",
                handler: handleWebhookGithub
            },
            {
              path: "/api/twilio",
              type: "post",
              handler: handleWebhookTwilio
          }
        ];

        this.updaters = this.config.webhooks;
        log = logger;
    }
}

function handleWebhookTwilio(req, res, next) {
  if (req.body) {
      var webhook = req.body;
      console.log("Raw Twilio Webhook: " + JSON.stringify(webhook));
      res.send(200);
  } else {
      res.send(400);
  }
}

function handleWebhookGithub(req, res, next) {
    if (req.body) {
        var webhook = req.body;
        console.log("Raw Webhook: " + JSON.stringify(webhook));
        if (webhook.repository && webhook.commits && webhook.head_commit) {
            var repository = webhook.repository;
            var head = req.body.head_commit;

            log.info("Repository " + repository.name + " has been updated by " + head.author.name + " with message: " + head.message);
            if (this.updaters[repository.name]) {
                var settings = this.updaters[repository.name];
                log.info("Triggering redeploy for " + repository.name + " located at " + settings.path + " with script " + settings.script);
                try {
                    exec(settings.path + "/" + settings.script, { cwd: settings.path }, (error, stdout, stderr) => {
                        if (error) {
                            log.error("exec error: " + error);
                            return;
                        }
                        // Log these to the console only, not to log files
                        log.info("stdout: " + stdout);
                        log.error("stderr: " + stderr);
                    });
                } catch (error) {
                    log.error("An error occurred while running redeploy script for " + repository.name);
                }
            }
        } else {
            log.info("Got a webhook, but it did not match the known github format");
        }
        res.send(200);
    } else {
        res.send(400);
    }
}

module.exports = Webhook;
