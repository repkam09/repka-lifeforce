const log = require("../utils/logger");
const request = require('request');

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
        if (req.params.url) {
            request.get("http://i.imgur.com/" + req.params.url + ".jpg").pipe(res);
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