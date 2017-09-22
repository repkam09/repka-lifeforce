const log = require("../utils/logger");
const config = require("../config.json");

var SlackBot = require('slackbots');

// create a bot
var bot = new SlackBot({
    token: config.slack.token,
    name: 'kabuildbot'
});

function addHandlers(server) {
    server.post("/api/slack/log", (req, res, next) => {
        debugger;
        if (req.body) {
            var payload = req.body + "";

            bot.postMessageToChannel('general', payload, {
                icon_emoji: ':robot_face:'
            });

            // send a message to the chat acknowledging receipt of their message 
            res.send(200, { error: false });
        } else {
            res.send(400, { error: true, msg: "No request body" });
        }
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "slack",
    start: (server) => {
        addHandlers(server);
    }
}


