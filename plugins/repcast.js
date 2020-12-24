const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const Transmission = require('transmission');
const fs = require('fs');
const os = require("os");
const uuid = require("uuid");

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
    }
}


function handleRepcastTorAdd(req, res, next) {
    try {
        var magnet = Buffer.from(req.params.magnet, 'base64').toString();
        this.log.verbose("Request on toradd for " + magnet);

        const instance = new Transmission({ port: this.settings.port, host: this.settings.host, username: this.settings.username, password: this.settings.password });
        instance.addUrl(magnet, {}, function (err, result) {
            if (err) {
                console.log(err);
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
                //fs.unlink(tempfile, () => { });
                console.log(err);
                res.send(400, err);
            } else {
                //fs.unlink(tempfile, () => { });
                res.send(200, result);
            }
        });
    } catch (err) {
        res.send(500, err.message);
    }

    return next();
}


module.exports = RepCast;
