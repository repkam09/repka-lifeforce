const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class SlackBot extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/slack/log",
                type: "post",
                handler: handleSlackPush
            },
            {
                path: "/api/slack/deploy",
                type: "post",
                handler: handleSlackPushDeploy
            }
        ];

        this.kmbot = new SlackBot({
            token: this.config.slack.kmweb,
            name: 'kabuildbot'
        });
    }
}

function handleSlackPush(req, res, next) {
    if (req.body) {
        var payload = req.body + "";

        this.kmbot.postMessageToChannel('ecoweb-development', payload, {
            icon_emoji: ':robot_face:'
        });

        // send a message to the chat acknowledging receipt of their message 
        res.send(200, { error: false });
    } else {
        res.send(400, { error: true, msg: "No request body" });
    }
}

function handleSlackPushDeploy(req, res, next) {
    if (req.body) {
        var payload = req.body + "";

        this.kmbot.postMessageToChannel('ecoweb-deploybot', payload, {
            icon_emoji: ':robot_face:'
        });

        // send a message to the chat acknowledging receipt of their message 
        res.send(200, { error: false });
    } else {
        res.send(400, { error: true, msg: "No request body" });
    }
}

module.exports = SlackBot;
