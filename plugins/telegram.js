const LifeforcePlugin = require("../utils/LifeforcePlugin.js");



class TelegramBot extends LifeforcePlugin {
    constructor(server, logger, name) {
        super(server, logger, name);
        this.apiMap = [
            {
                path: "/api/telegram/log",
                type: "post",
                handler: handleTelegramLog
            }
        ];
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;

        const TGBot = require('node-telegram-bot-api');
        this.bot = new TGBot(this.config.telegram.token, { polling: true });

        this.bot.on('message', (msg) => {
            const chatId = msg.chat.id;

            // send a message to the chat acknowledging receipt of their message 
            this.bot.sendMessage(chatId, "Hello! Here is the information about your chat message: \n" + JSON.stringify(msg.chat));
        });
    }
}

function handleTelegramLog(req, res, next) {
    if (req.body) {
        var payload = req.body + "";

        // send a message to the chat acknowledging receipt of their message 
        this.bot.sendMessage(config.telegram.chatid, payload);
        res.send(200, { error: false });
    } else {
        res.send(400);
    }
}

module.exports = TelegramBot;

