/**
 * This proxy function can be used to pass requests from one version of Lifeforce to another.
 */

const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const proxy = require("../proxy.json");
const axios = require("axios");


class Proxy extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/proxy/.*",
                type: "get",
                handler: handleProxyFunction
            },
            {
                path: "/api/proxy/.*",
                type: "post",
                handler: handleProxyFunction
            }
        ];
    }
}

function handleProxyFunction(req, res, next) {
    try {
        const requrl = req.url.replace("/api/proxy/", "");
        const remote_base = proxy.remote;

        const newurl = remote_base + requrl;
        this.log.info("Lifeforce Proxy hit for " + requrl + " going to " + remote_base);

        let head = req.headers;
        head["x-repka-lf-proxy"] = "repka-lifeforce-proxy";

        if (head.host) {
            delete head.host;
        }

        // Send the request to the real location
        axios({
            method: req.method,
            url: newurl,
            headers: head
        }).then((res_remote) => {
            res.send(res_remote.status, res_remote.data);
        }).catch((err) => {
            res.send(500, err.message);
        });
    } catch (err) {
        res.send(500, err.message);
    }
}

module.exports = Proxy;
