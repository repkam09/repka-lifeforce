const log = require("../utils/logger");
const request = require('request');
const config = require("../config.json");

function addHandlers(server) {
    server.get("/api/instagram/recent/:username", (req, res, next) => {
        if (req.params.username) {
            let url = "https://www.instagram.com/" + req.params.username + "/?__a=1";
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "instagram",
    start: (server) => {
        addHandlers(server);
    }
}
