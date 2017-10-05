const LifeforcePlugin = require("../utils/LifeforcePlugin.js");



class Music extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
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
        this.request = require("request");
    }
}

function handleGetMusicNow(req, res, next) {
    if (req.params.name) {
        var url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&user=" + req.params.name + "&api_key=" + this.config.lastfmapi + "&format=json";
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handleGetMusicRecent(req, res, next) {
    if (req.params.name) {
        var url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" + req.params.name + "&api_key=" + this.config.lastfmapi + "&format=json";
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

module.exports = Music;
