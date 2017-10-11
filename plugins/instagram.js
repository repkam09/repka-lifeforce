const LifeforcePlugin = require("../utils/LifeforcePlugin.js");



class Instagram extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/instagram/recent/:username",
                type: "get",
                handler: handleInstagramRecent
            }
        ];
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