const apiMap = [
    {
        path: "/api/about",
        type: "get",
        handler: handleAboutApi
    },
    {
        path: "/api/lifeforce/restart",
        type: "get",
        handler: handleRestartLifeforce
    }
];

class MetaEndpoints {
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

function handleAboutApi(req, res, next) {
    var server = this.server;
    var apis = [];
    var keys = Object.keys(server.router.mounts);
    keys.forEach((key) => {
        var current = server.router.mounts[key];
        apis.push({ path: "https://api.repkam09.com" + current.spec.path, method: current.method });
    });
    res.send(200, apis);
}

function handleRestartLifeforce(req, res, next) {
    res.send(200);
    try {
        exec("pm2 restart lifeforce", (error, stdout, stderr) => {
            if (error) {
                log.error("exec error: " + error);
                return;
            }
            // Log these to the console only, not to log files
            log.info("stdout: " + stdout);
            log.error("stderr: " + stderr);
        });
    } catch (error) {
        log.error("An error occurred while running lifeforce restart");
    }
}

module.exports = MetaEndpoints;