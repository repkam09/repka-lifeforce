const log = require("../utils/logger");
const config = require("../config.json");
const fs = require("fs");

function addHandlers(server) {
    server.post("/api/files/upload", (req, res, next) => {
        if (req.files) {
            var data = req.files.filedata;
            var path = data.path;
            var newpath = config.logpathhidden + "uploads/" + data.name;
            fs.rename(path, newpath, (err) => {
                if (err) {
                    log.error("Error moving file from " + path + " to " + newpath);
                } else {
                    log.verbose("Moved file from " + path + " to " + newpath);
                }
            });

            log.info("Got file: " + data.name);
            log.verbose("Hash: " + data.hash);
            res.send(200, "https://files.repkam09.com/" + data.hash);
        } else {
            res.send(200, { filename: false });
        }

        next();
    });

    server.post("/api/images/upload", (req, res, next) => {
        if (req.files) {
            var data = req.files.filedata;
            var path = data.path;
            var newpath = config.publicpath + data.hash;
            fs.rename(path, newpath, (err) => {
                if (err) {
                    log.error("Error moving file from " + path + " to " + newpath);
                } else {
                    log.verbose("Moved file from " + path + " to " + newpath);
                }
            });

            log.info("Got file: " + data.name);
            log.verbose("Hash: " + data.hash);
            res.send(200, "https://repkam09.com/i/" + data.hash);
        } else {
            res.send(200, { filename: false });
        }

        next();
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "upload",
    start: (server) => {
        addHandlers(server);
    }
}
