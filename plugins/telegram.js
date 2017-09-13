const log = require("../utils/logger");
const config = require("../config.json");
const TelegramBot = require('node-telegram-bot-api');


// Set up the telegram bot at this level...
// Create a bot that uses 'polling' to fetch new updates 
const bot = new TelegramBot(config.telegram.token, { polling: true });

// Listen for any kind of message. There are different kinds of 
// messages. 
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // send a message to the chat acknowledging receipt of their message 
    bot.sendMessage(chatId, "Hello! Here is the information about your chat message: \n" + JSON.stringify(msg.chat));
});

function addHandlers(server) {
    server.post("/api/telegram/log", (req, res, next) => {
        if (req.body) {
            var payload = req.body + "";

            // send a message to the chat acknowledging receipt of their message 
            bot.sendMessage(config.telegram.chatid, payload);
            res.send(200, { error: false });
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
    name: "telegram",
    start: (server) => {
        addHandlers(server);
    }
}


