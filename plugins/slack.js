const apiMap = [
    {
        path: "/api/slack/log",
        type: "post",
        handler: handleSlackPush
    }
];

class SlackBot {
    constructor(server, logger, name) {
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

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
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