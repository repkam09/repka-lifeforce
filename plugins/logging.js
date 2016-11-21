const log = require("../utils/logger");
const fs = require('fs');
const config = require("../config.json");

function addHandlers(server) {
    server.post("/api/logging/:name", (req, res, next) => {
        if (req.params.name && req.body) {
            var folder = req.params.name;
            var payload = req.body;
            // Dont need to wait on the write, respond quickly
            res.send(200);
            var logfilepath = config.logpath + folder + "log.txt";
            // Create the file if it does not exist
            fs.closeSync(fs.openSync(logfilepath, 'w'));
            // Append the log message to the file
            fs.appendFile(logfilepath, req.body.msg + "\n", function (err) {
                if (err) {
                    console.log("Error writing to file " + logfilepath + JSON.stringify(err));
                }
            });
        } else {
            res.send(400);
        }
    });

    server.get("/api/logging/:name/clear", (req, res, next) => {
        if (req.params.name) {
            var folder = req.params.name;
            var logfilepath = config.logpath + folder + "/log.txt";
            fs.unlink(logfilepath, function (err) {
                if (err) {
                    res.send(500);
                } else {
                    console.log("Deleted log file " + logfilepath);
                    res.send(200);
                }
            });
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
    name: "logging",
    start: (server) => {
        addHandlers(server);
    }
}


