const apiMap = [
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

class Weather {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
    }
}

function handleWeatherZipCode(req, res, next) {
    if (req.params.zip) {
        let url = "http://api.openweathermap.org/data/2.5/weather?zip=" + req.params.zip + " &appid=" + config.weatherapikey;
        request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handleWeatherCityName(req, res, next) {
    if (req.params.name) {
        let url = "http://api.openweathermap.org/data/2.5/weather?q=" + req.params.name + " &appid=" + config.weatherapikey;
        request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}
module.exports = Weather;