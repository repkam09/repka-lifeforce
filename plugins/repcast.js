const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const Transmission = require('transmission');

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
            }
        ];

        this.settings = this.config.torrent;
    }
}

function handleRepcastTorAdd(req, res, next) {
    var magnet = new Buffer(req.params.magnet, 'base64').toString();
    this.log.verbose("Request on toradd for " + magnet);

    try {
        const instance = new Transmission({ port: this.settings.port, host: this.settings.host, username: this.settings.username, password: this.settings.password });
        instance.addUrl(magnet, {}, function (err, result) {
            if (err) {
                console.log(err);
                res.send(400, err);
            } else {
                var id = result.id;
                res.send(200, { torrentid: id });
            }
        });
    } catch (err) {
        res.send(500, err.message);

    }
}

module.exports = RepCast;
