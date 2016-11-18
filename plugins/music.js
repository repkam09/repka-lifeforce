const log = require("../utils/logger");
const request = require('request');
const config = require("../config.json");

function addHandlers(server) {
    server.get("/api/music/now/:name", (req, res, next) => {
        if (req.params.name) {
            var url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&user=" + req.params.name + "&api_key=" + config.lastfmapi + "&format=json";
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

    server.get("/api/music/recent/:name", (req, res, next) => {
        if (req.params.name) {
            var url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" + req.params.name + "&api_key=" + config.lastfmapi + "&format=json";
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
    enabled: false,
    name: "music",
    start: (server) => {
        addHandlers(server);
    }
}
