const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require('fs');

//const serverhostname = "http://localhost:16001";
const serverhostname = "https://api.repkam09.com";

class Logging extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/logger/log",
                type: "post",
                handler: handleLoggerPost
            },
            {
                path: "/api/logger/logfile",
                type: "post",
                handler: handleLoggerFilePost
            },
            {
                path: "/api/logger/log",
                type: "get",
                handler: handleLoggerGet
            },
            {
                path: "/api/logger/clear",
                type: "get",
                handler: handleLoggerClear
            }
        ];

        this._messageQueue = [];
    }
}

function handleLoggerClear(req, res, next) {
    this._messageQueue = [];
    res.send(200, "cleared");

    next();
}

function handleLoggerGet(req, res, next) {
    res.send(200, this._messageQueue);
    next();
}

function handleLoggerPost(req, res, next) {
    if (req.params) {
        req.params.map((message) => {
            this._messageQueue.push(message);
        });

        res.send(200, "OK!");
    } else {
        console.log(typeof req.params);
        res.send(200, "Bad Request");
    }

    next();
}

function handleLoggerFilePost(req, res, next) {
    var logbuilder = [];
    if (req.params) {
        req.params.map((message) => {
            logbuilder.push(message);
        });

        res.send(200, "OK!");
    } else {
        console.log(typeof req.params);
        res.send(200, "Bad Request");
    }

    // Write out to a file:
    try {
        var date = new Date();
        var filename = this.config.logpath + date.getTime() + ".json";
        console.log("Trying to write out log file " + filename);
        fs.writeFile(filename, JSON.stringify(logbuilder), 'utf8', () => {
            console.log("Wrote out log dump file " + filename);
        });
    } catch (error) {
        this.log.info("Error while writing out log file!");
    }

    next();
}

module.exports = Logging;