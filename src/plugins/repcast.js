const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const Transmission = require("transmission");
const fs = require("fs");
const os = require("os");
const uuid = require("uuid");

let log = null;

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

class RepCast extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/repcast/toradd/:magnet",
                type: "get",
                handler: handleRepcastTorAdd
            },
            {
                path: "/repcast/toradd",
                type: "post",
                handler: handleRepcastTorAddFile
            }
        ];

        this.settings = this.config.torrent;
        log = logger;
    }
}


function handleRepcastTorAdd(req, res, next) {
    try {
        var magnet = Buffer.from(req.params.magnet, "base64").toString();
        log.verbose("Request on toradd for " + magnet);

        const instance = new Transmission({ port: this.settings.port, host: this.settings.host, username: this.settings.username, password: this.settings.password });
        instance.addUrl(magnet, {}, function (err, result) {
            if (err) {
                log.error("Error adding torrent: " + err.message);
                res.send(400, err);
            } else {
                res.send(200, result);
            }
        });
    } catch (err) {
        res.send(500, err.message);
    }

    return next();
}

function handleRepcastTorAddFile(req, res, next) {
    try {
        const tempfile = os.tmpdir() + "/" + uuid.v1() + ".torrent";
        fs.writeFileSync(tempfile, req.body);

        const instance = new Transmission({ port: this.settings.port, host: this.settings.host, username: this.settings.username, password: this.settings.password });
        instance.addFile(tempfile, {}, function (err, result) {
            if (err) {
                res.send(400, err);
                log.error("Error adding torrent: " + err.message);
            } else {
                res.send(200, result);
                log.verbose("Added torrent: " + result.name);
            }

            fs.unlink(tempfile, (err) => { if (err) { log.error("Unable to clean up file: " + tempfile); } });
        });
    } catch (err) {
        res.send(500, err.message);
    }

    return next();
}


module.exports = RepCast;
