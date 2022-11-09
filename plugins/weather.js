const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class Weather extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/weather/current/zip/:zip",
                type: "get",
                handler: handleWeatherZipCode,
                cacheTTL: 120
            },
            {
                path: "/api/weather/forecast/zip/:zip",
                type: "get",
                handler: handleWeatherForecastZipCode,
                cacheTTL: 1200
            }
        ];

        this.request = require("request");
    }
}

function handleWeatherZipCode(req, res, next) {
    if (req.params.zip) {
        this.log.info("Looking up weather for " + req.params.zip);
        try {
            let url = "http://api.openweathermap.org/data/2.5/weather?zip=" + req.params.zip + "&appid=" + this.config.weatherapikey;
            this.request.get(url).pipe(res);
        } catch (err) {
            this.log.error("Unable to get current weather for " + req.params.zip + ", err: " + err.message);
            res.send(500);
        }
    } else {
        this.log.info("Bad request for current weather");
        res.send(400);
    }
}

function handleWeatherForecastZipCode(req, res, next) {
    if (req.params.zip) {
        this.log.info("Looking up weather for " + req.params.zip);
        try {
            let url = "http://api.openweathermap.org/data/2.5/forecast?zip=" + req.params.zip + "&appid=" + this.config.weatherapikey;
            this.request.get(url).pipe(res);
        } catch (err) {
            this.log.error("Unable to get weather forecast for " + req.params.zip + ", err: " + err.message);
            res.send(500);
        }
    } else {
        this.log.info("Bad request for weather forecast");
        res.send(400);
    }
}
module.exports = Weather;