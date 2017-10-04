const log = require("../utils/logger");
const https = require('https');

function addHandlers(server) {
    server.get("/api/sslinfo/:sslurl", (req, res, next) => {
        if (req.params.sslurl) {
            var decodedurl = new Buffer(req.params.sslurl, 'base64').toString('ascii');
            var options = {
                host: decodedurl,
                port: 443,
                method: 'GET'
            };

            var reqinner = https.request(options, function (response) {
                var certdata = response.connection.getPeerCertificate();
                res.send(200, certdata);
            });

            reqinner.end();
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
    name: "ssl cert info",
    start: (server) => {
        addHandlers(server);
    }
}