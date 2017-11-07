const LifeforcePlugin = require("../utils/LifeforcePlugin.js");


class LGTVControls extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/lgtv/volup",
                type: "get",
                handler: handleTvVolumeUp
            },
            {
                path: "/api/lgtv/voldown",
                type: "get",
                handler: handleTvVolumeDown
            }
        ];

        const TV_API = require("node-lgtv-api");
        this.tv_ip_address = "192.168.1.10";
        this.tvApi = new TV_API(tv_ip_address, '8080', '983726');
    }
}

function handleTvVolumeUp(req, res, next) {
    const tvApi = this.tvApi;
    tvApi.authenticate().then(() => tvApi.processCommand(tvApi.TV_CMD_VOLUME_UP, []).then(console.log, console.error), console.error);
    res.send(200, "OK!");
}

function handleTvVolumeDown(req, res, next) {
    const tvApi = this.tvApi;
    tvApi.authenticate().then(() => tvApi.processCommand(tvApi.TV_CMD_VOLUME_DOWN, []).then(console.log, console.error), console.error);
    res.send(200, "OK!");
}

module.exports = LGTVControls;