const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class YouTube extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/youtube/download/:videoid",
                type: "get",
                handler: handleYoutubeDownload
            }
        ];
    }
}

function handleYoutubeDownload(req, res, next) {
    return res.send(200, { error: true, details: "Not Implemented" });
}

module.exports = YouTube;
