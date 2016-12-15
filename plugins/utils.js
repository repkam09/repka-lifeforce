const log = require("../utils/logger");
const request = require('request');
const exec = require('child_process').exec;
const fs = require('fs');
const config = require("../config.json");


function addHandlers(server) {
    server.get("/api/about", (req, res, next) => {
        var apis = [];
        var keys = Object.keys(server.router.mounts);
        keys.forEach((key) => {
            var current = server.router.mounts[key];
            apis.push({ path: "https://api.repkam09.com" + current.spec.path, method: current.method });
        });

        res.send(200, apis);
    });


    server.get("/api/imgur/:url", (req, res, next) => {
        // Download and cache the image for future loads
        if (req.params.url) {
            var url = "http://i.imgur.com/" + req.params.url + ".jpg";
            var encodedName = new Buffer(url).toString('base64');
            var path = config.logpathhidden + "uploads/imgur_" + encodedName;

            new Promise((resolve, reject) => {
                try {
                    fs.accessSync(path);
                    resolve();
                } catch (e) {
                    request.get(url).pipe(fs.createWriteStream(path)).on('close', () => {
                        resolve();
                    });
                }
            }).then(() => {
                fs.createReadStream(path).pipe(res);
            });
        }
    });

    server.post("/api/b64", (req, res, next) => {
        if (req.body) {
            var b64 = new Buffer(req.body).toString('base64');
            res.send(200, b64);
        } else {
            res.send(400, "Bad Request");
        }
    });

    server.post("/api/d64", (req, res, next) => {
        if (req.body) {
            var d64 = new Buffer(req.body, 'base64').toString('ascii')
            res.send(200, d64);
        } else {
            res.send(400, "Bad Request");
        }
    });

    server.get("/api/lifeforce/restart", (req, res, next) => {
        res.send(200);
        try {
            exec("pm2 restart lifeforce", (error, stdout, stderr) => {
                if (error) {
                    log.error("exec error: " + error);
                    return;
                }
                // Log these to the console only, not to log files
                log.info("stdout: " + stdout);
                log.error("stderr: " + stderr);
            });
        } catch (error) {
            log.error("An error occurred while running lifeforce restart");
        }
    });

}


/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "utils",
    start: (server) => {
        addHandlers(server);
    }
}
