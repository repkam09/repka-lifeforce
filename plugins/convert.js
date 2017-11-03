const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class FormatConvert extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/b64",
                type: "post",
                handler: handleBase64Encode
            },
            {
                path: "/api/d64",
                type: "post",
                handler: handleBase64Decode
            }
        ];
    }
}

function handleBase64Encode(req, res, next) {
    if (req.body) {
        var b64 = new Buffer(req.body).toString('base64');
        res.send(200, b64);
    } else {
        res.send(400, "Bad Request");
    }
}

function handleBase64Decode(req, res, next) {
    if (req.body) {
        var d64 = new Buffer(req.body, 'base64').toString('ascii');
        res.send(200, d64);
    } else {
        res.send(400, "Bad Request");
    }
}

module.exports = FormatConvert;