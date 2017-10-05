const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

let messageQueue = [];
let readySend = false;
let readyTimer = null;

class TelegramBot extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/telegram/log",
                type: "post",
                handler: handleTelegramLog
            }
        ];

        const TGBot = require('node-telegram-bot-api');
        this.bot = new TGBot(this.config.telegram.token, { polling: true });

        this.bot.on('message', (msg) => {
            const chatId = msg.chat.id;

            // send a message to the chat acknowledging receipt of their message 
            this.bot.sendMessage(chatId, "Hello! Here is the information about your chat message: \n" + JSON.stringify(msg.chat));
        });

        var messageSend = function (message) {
            messageQueue.push(message);
        }

        logger.registerCallback(messageSend.bind(this));

        readyTimer = setInterval(() => {
            if (messageQueue.length > 0) {
                this.bot.sendMessage(this.config.telegram.chatid, messageQueue.join("\n"));
                messageQueue = [];
            }
        }, 10000);
    }
}

function handleTelegramLog(req, res, next) {
    if (req.body) {
        var payload = req.body + "";

        // send a message to the chat acknowledging receipt of their message 
        this.bot.sendMessage(this.config.telegram.chatid, payload);
        res.send(200, { error: false });
    } else {
        res.send(400);
    }
}

module.exports = TelegramBot;

