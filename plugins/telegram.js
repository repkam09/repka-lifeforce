const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");

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

    const TGBot = require("node-telegram-bot-api");
    this.bot = new TGBot(this.config.telegram.token, { polling: true });

    this.bot.on("message", msg => {
      const chatId = msg.chat.id;

      let response =
        "Hello! Here is the information about your chat message: \n" +
        JSON.stringify(msg.chat);

      if (msg.document) {
        response = "You sent a file: " + JSON.stringify(msg.document);
        const filepath = this.config.telegram.filepath;

        this.bot
          .downloadFile(msg.document.file_id, filepath)
          .then(newpath => {
            let savepath = filepath + "/" + msg.document.file_name;

            // Take the file from newpath and move it into a better location
            fs.rename(newpath, savepath, done => {
              this.bot.sendMessage(chatId, "Saved " + msg.document.file_id);
            });
          })
          .catch(err => {
            this.bot.sendMessage(
              chatId,
              "Unable to save " + msg.document.file_id + ", err: " + err.message
            );
          });
      }

      // send a message to the chat acknowledging receipt of their message
      this.bot.sendMessage(chatId, response);
    });

    if (this.config.telegram.logger) {
      var messageSend = function(message) {
        messageQueue.push(message);
      };

      logger.registerCallback(messageSend.bind(this));

      readyTimer = setInterval(() => {
        if (messageQueue.length > 0) {
          this.bot.sendMessage(
            this.config.telegram.chatid,
            messageQueue.join("\n")
          );
          messageQueue = [];
        }
      }, 10000);
    }
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
