const log = require("../utils/logger");
const fs = require('fs');

function addHandlers(server) {
    log.debug("Adding handler for logging post request");
    server.post("/api/logging/:name", (req, res, next) => {
        if (req.params.name && req.body) {
            var folder = req.params.name;
            var payload = req.body;
            res.send(200);
            var logfilepath = logpath + "" + folder + "log.txt";

            fs.closeSync(fs.openSync(logfilepath, 'w'));
            fs.appendFile(logfilepath, req.body.msg + "\n", function (err) {
                console.log("Error writing to file " + logfilepath + JSON.stringify(err));
            });
        } else {
            res.send(400);
        }
    });

    log.debug("Adding handler for logging get request");
    server.get("/api/logging/:name/clear", (req, res, next) => {
        if (req.params.name) {
            var folder = req.params.name;
            res.send(200);
            var logfilepath = logpath + "/" + folder + "/log.txt";
            fs.unlink(logfilepath, function (err) {
                console.log("Deleted log file " + logfilepath);
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


