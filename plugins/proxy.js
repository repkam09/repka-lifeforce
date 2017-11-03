const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const request = require("request");

class Proxy extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/proxy/stream/:encodedurl",
                type: "get",
                handler: handleStreamProxy
            }
        ];
    }
}

function handleStreamProxy(req, res, next) {
    if (req.params.encodedurl) {
        var urlparse = new Buffer(req.params.encodedurl, 'base64').toString('ascii');
        request.get(urlparse).pipe(res);
    } else {
        res.send(400);
    }

    next();
}

module.exports = Proxy;