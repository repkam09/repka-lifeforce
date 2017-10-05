const apiMap = [
    {
        path: "/api/instagram/recent/:username",
        type: "get",
        handler: handleInstagramRecent
    }
];

class Instagram {
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

function handleInstagramRecent(req, res, next) {
    if (req.params.username) {
        let url = "https://www.instagram.com/" + req.params.username + "/?__a=1";
        this.request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

module.exports = Instagram;