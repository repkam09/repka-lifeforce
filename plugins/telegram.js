const apiMap = [
    {
        path: "/api/telegram/log",
        type: "post",
        handler: handleTelegramLog
    }
];

class TelegramBot {
    constructor(server, logger, name) {
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

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
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

