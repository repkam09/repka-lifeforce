const log = require("../utils/logger");
const request = require('request');
const config = require("../config.json");

function addHandlers(server) {
    server.get("/api/weather/current/zip/:zip", (req, res, next) => {
        if (req.params.zip) {
            let url = "http://api.openweathermap.org/data/2.5/weather?zip=" + req.params.zip + " &appid=" + config.weatherapikey;
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

    server.get("/api/weather/current/name/:name", (req, res, next) => {
        if (req.params.name) {
            let url = "http://api.openweathermap.org/data/2.5/weather?q=" + req.params.name + " &appid=" + config.weatherapikey;
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
    name: "weather",
    start: (server) => {
        addHandlers(server);
    }
}
