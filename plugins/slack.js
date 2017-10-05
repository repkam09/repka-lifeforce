const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class SlackBot extends LifeforcePlugin {
    constructor(server, logger, name) {
        super(server, logger, name);
        this.apiMap = [
            {
                path: "/api/slack/log",
                type: "post",
                handler: handleSlackPush
            }
        ];
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;

        const SlackBot = require('slackbots');
        this.bot = new SlackBot({
            token: this.config.slack.token,
            name: 'kabuildbot'
        });
    }
}

function handleSlackPush(req, res, next) {
    if (req.body) {
        var payload = req.body + "";

        this.bot.postMessageToChannel('general', payload, {
            icon_emoji: ':robot_face:'
        });

        // send a message to the chat acknowledging receipt of their message 
        res.send(200, { error: false });
    } else {
        res.send(400, { error: true, msg: "No request body" });
    }
}

module.exports = SlackBot;