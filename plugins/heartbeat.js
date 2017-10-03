const apiMap = [
    {
        path: "/api/lifeforce/heartbeat/:appname",
        type: "get",
        handler: handleHeartbeat
    },
    {
        path: "/api/lifeforce/analytics/:appname",
        type: "get",
        handler: handleAnalytics
    },
    {
        path: "/api/lifeforce/heartbeat/:appname/last",
        type: "get",
        handler: handleHeartbeatLast
    }
];

class HeartbeatAnalytics {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;

        this.applist = [];
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
    }
}

function handleHeartbeat(req, res, next) {
    if (req.params.appname) {
        var timestamp = new Date().getTime();
        log.debug("Heartbeat from " + req.params.appname + " at " + Date(timestamp.toLocaleString()));
        res.send(200, "OK");
        this.applist[req.params.appname] = timestamp;
    } else {
        res.send(400, "Please supply an application name");
    }
}


function handleHeartbeatLast(req, res, next) {
    if (req.params.appname) {
        if (this.applist.hasOwnProperty(req.params.appname)) {
            res.send(200, this.applist[req.params.appname]);
        } else {
            res.send(400, 0);
        }
    } else {
        res.send(400, "Please supply an application name");
    }
}

function handleAnalytics(req, res, next) {
    if (req.params.appname) {
        var timestamp = new Date().getTime();
        log.debug("Page view analytics from " + req.params.appname + " at " + Date(timestamp.toLocaleString()));
        res.send(200, "OK");
        this.applist[req.params.appname] = timestamp;
    } else {
        res.send(400, "Please supply an application name");
    }
}


module.exports = HeartbeatAnalytics;