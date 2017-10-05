const LifeforcePlugin = require("../utils/LifeforcePlugin.js");



class Instagram extends LifeforcePlugin {
    constructor(server, logger, name) {
        super(server, logger, name);
        this.apiMap = [
            {
                path: "/api/instagram/recent/:username",
                type: "get",
                handler: handleInstagramRecent
            }
        ];
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
        this.request = require("request");
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