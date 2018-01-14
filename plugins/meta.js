const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

//const serverhostname = "http://localhost:16001";
const serverhostname = "https://api.repkam09.com";

class MetaEndpoints extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/about",
                type: "get",
                handler: handleAboutApi
            },
            {
                path: "/",
                type: "get",
                handler: handleAboutApi
            },
            {
                path: "/api/gettest",
                type: "get",
                handler: handleGetTest
            },
            {
                path: "/api/posttest",
                type: "post",
                handler: handlePostTest
            },
            {
                path: "/api/getip",
                type: "get",
                handler: handleGetIp
            }

        ];
    }
}

function handleGetIp(req, res, next) {
    var clientip = "unknown";
    if (req.headers['x-forwarded-for']) {
        clientip = req.headers['x-forwarded-for'];
    } else if (req.connection.remoteAddress) {
        clientip = req.connection.remoteAddress;
    }
    res.send(200, { ip: clientip });
    next();
}

function handleAboutApi(req, res, next) {
    var apis = [];
    var keys = Object.keys(this.restifyserver.router.mounts);
    keys.forEach((key) => {
        var current = this.restifyserver.router.mounts[key];
        apis.push({ path: serverhostname + current.spec.path, method: current.method, plugin: current.plugin });
    });
    res.send(200, apis);
}

function handleGetTest(req, res, next) {
    res.send(200, "You have made a GET request! OK!");
}

function handlePostTest(req, res, next) {
    if (req.body) {
        res.send(200, req.body);
    } else {
        if (req.params) {
            res.send(200, req.params);
        } else {
            res.send(200, "You dont seem to have POSTed anything. But we got the request.");
        }
    }
    next();
}

module.exports = MetaEndpoints;
