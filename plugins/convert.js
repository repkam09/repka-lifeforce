const apiMap = [
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

class FormatConvert {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
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
        var d64 = new Buffer(req.body, 'base64').toString('ascii')
        res.send(200, d64);
    } else {
        res.send(400, "Bad Request");
    }
}

module.exports = FormatConvert;