const apiMap = [
    {
        path: "/api/music/now/:name",
        type: "get",
        handler: handleGetMusicNow
    },
    {
        path: "/api/music/recent/:name",
        type: "get",
        handler: handleGetMusicRecent
    }
];

class Music {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
        this.request = require("request");
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
    }
}

function handleGetMusicNow(req, res, next) {
    if (req.params.name) {
        var url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&user=" + req.params.name + "&api_key=" + config.lastfmapi + "&format=json";
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handleGetMusicRecent(req, res, next) {
    if (req.params.name) {
        var url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" + req.params.name + "&api_key=" + config.lastfmapi + "&format=json";
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

module.exports = Music;
