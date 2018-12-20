const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const request = require("request");
const crypto = require("crypto");

const live_systems = {};

class Proxy extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/proxy/stream/:encodedurl",
                type: "get",
                handler: handleStreamProxy
            },
            {
                path: "/api/register",
                type: "post",
                handler: handleSystemRegister
            },
            {
                path: "/api/register/:systemid",
                type: "get",
                handler: handleSystemGetJobs
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

    return next();
}


function handleSystemRegister(req, res, next) {
    if (this.hasSecureHeader(req, res) && req.body.name) {
        const id = crypto.randomBytes(16).toString("hex");
        live_systems[id] = { name: req.body.name, jobs: [] };

        this.log.info("Registered a new system " + req.body.name + " as " + id);

        res.send(200, { uid: id });
    }
    return next();
}


function handleSystemGetJobs(req, res, next) {
    if (this.hasSecureHeader(req, res)) {
        if (req.params.systemid && live_systems[req.params.systemid]) {
            this.log.info("Got a request from " + live_systems[req.params.systemid].name + " ");
            res.send(200, { jobs: live_systems[req.params.systemid].jobs });
        } else {
            res.send(400, "Not registered");
        }
    }
    return next();
}



module.exports = Proxy;