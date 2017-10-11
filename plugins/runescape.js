const LifeforcePlugin = require("../utils/LifeforcePlugin.js");



class RuneScape extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/runescape/rs3/current/:username",
                type: "get",
                handler: handleRs3CurrentRaw
            },
            {
                path: "/api/runescape/rs3/current/:username/json",
                type: "get",
                handler: handleRs3CurrentJSON
            },
            {
                path: "/api/runescape/avatar/:username/head",
                type: "get",
                handler: handleRsAvatarHead
            },
            {
                path: "/api/runescape/osrs/current/:username",
                type: "get",
                handler: handleOsrsCurrentRaw
            },
            {
                path: "/api/runescape/feed/news",
                type: "get",
                handler: handleRsNewsFeed
            },
            {
                path: "/api/runescape/feed/devblog",
                type: "get",
                handler: handleRsDevblogFeed
            }
        ];
        this.request = require("request");
    }
}

function handleRs3CurrentRaw(req, res, next) {
    if (req.params.username) {
        let url = "http://hiscore.runescape.com/index_lite.ws?player=" + req.params.username;
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handleRs3CurrentJSON(req, res, next) {
    if (req.params.username) {
        let url = "http://hiscore.runescape.com/index_lite.ws?player=" + req.params.username;
        this.request.get(url, (error, response, body) => {
            if (!error) {
                // Split on the lines
                let response = {
                    player: {
                        name: req.params.username, avatar: "/api/runescape/avatar/" + req.params.username + "/head"
                    },
                    skills: {}
                };
                var lines = body.split("\n");
                lines.forEach((line, index) => {
                    var parts = line.split(",");
                    if (parts.length === 3) {
                        response.skills[skilllist[index]] = { rank: parts[0], level: parts[1], exp: parts[2] };
                    }
                });

                res.send(200, response);
            } else {
                res.send(500);
            }
        });
    } else {
        res.send(400);
    }
}

function handleRsAvatarHead(req, res, next) {
    // Download and cache the image for future loads
    if (req.params.username) {
        var url = "http://services.runescape.com/m=avatar-rs/" + req.params.username + "/chat.png"
        urlcache(url, "rs", this.config.logpathhidden).then((path) => {
            fs.createReadStream(path).pipe(res);
        }).catch((error) => {
            res.send(500, error);
        });
    }
}

function handleOsrsCurrentRaw(req, res, next) {
    if (req.params.username) {
        let url = "http://services.runescape.com/m=hiscore_oldschool/index_lite.ws?player=" + req.params.username;
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handleRsNewsFeed(req, res, next) {
    let url = "http://services.runescape.com/m=news/latest_news.rss";
    this.request.get(url).pipe(res);
}

function handleRsDevblogFeed(req, res, next) {
    let url = "http://services.runescape.com/m=news/latest_news.rss";
    this.request.get(url).pipe(res);
}

module.exports = RuneScape;