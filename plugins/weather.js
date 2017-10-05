const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class Weather extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/weather/current/zip/:zip",
                type: "get",
                handler: handleWeatherZipCode
            },
            {
                path: "/api/weather/current/name/:name",
                type: "get",
                handler: handleWeatherCityName
            }
        ];

        this.request = require("request");
    }
}

function handleWeatherZipCode(req, res, next) {
    if (req.params.zip) {
        let url = "http://api.openweathermap.org/data/2.5/weather?zip=" + req.params.zip + "&appid=" + this.config.weatherapikey;
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handleWeatherCityName(req, res, next) {
    if (req.params.name) {
        let url = "http://api.openweathermap.org/data/2.5/weather?q=" + req.params.name + " &appid=" + this.config.weatherapikey;
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}
module.exports = Weather;