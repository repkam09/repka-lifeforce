const hasSecureHeader = require("./secure.js");
const cache = require("./cache.js");

class LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.restifyserver = restifyserver;
        this.name = name;
        this.hasSecureHeader = hasSecureHeader;
    }

    setResponse(req, callback, status, response, content) {
        req.set("status", status);
        req.set("response", response)
        req.set("content", content)

        return callback();
    }

    addHandlers(pluginname) {
        for (var i = 0; i < this.apiMap.length; i++) {
            var item = this.apiMap[i];
            var path = item.path;
            var type = item.type.toUpperCase();
            this.log.info("" + type + " - " + path + "", this.name);

            const defaultMiddleware = item.handler.bind(this);

            if (item.cacheTTL) {
                this.restifyserver[item.type](item.path, [
                    checkRedisCacheMiddleware(this.log),
                    defaultMiddleware,
                    updateRedisCacheMiddleware(item.cacheTTL),
                    sendResponseMiddleware()
                ]);

            } else {
                this.restifyserver[item.type](item.path, defaultMiddleware);
            }

            this.restifyserver.updateAbout({ method: type, path: "https://api.repkam09.com" + path, plugin: pluginname, cacheTTL: item.cacheTTL });
        }
    }

    addSocketHandler(pluginname) {
        if (!this.wsconfig) {
            return { func: () => { }, scope: null }
        }

        if (!this.wsconfig.func) {
            throw new Error("Plugins with a websocket config must have a handler function")
        }

        if (!this.wsconfig.scope) {
            throw new Error("Plugins with a websocket config must have a scope defined")
        }

        return this.wsconfig;
    }
}

function buildKey(req) {
    const header = req.headers["repka-repcast-token"] || "null"
    const path = req.getPath();
    const query = req.getQuery() || "null";

    const key = path + ":" + query + ":" + header;
    return key;
}


function checkRedisCacheMiddleware(logger) {
    return function checkRedisCache(req, res, next) {

        const key = buildKey(req);
        cache.readCache(key).then((result) => {
            if (!result.hasCache) {
                return next();
            }

            logger.info("Cache: " + key);

            if (result.content) {
                res.set("content-type", result.content);
            }

            res.send(result.status, result.response);
            return;
        })
    }
}

function updateRedisCacheMiddleware(ttl) {
    return function updateRedisCache(req, res, next) {
        const key = buildKey(req);

        const response = req.get("response")
        const status = req.get("status")
        const content = req.get("content") || "application/json";

        cache.writeCache(key, status, response, content, ttl).then(() => {
            return next()
        });
    }
}

function sendResponseMiddleware() {
    return function sendResponse(req, res, _next) {
        const response = req.get("response")
        const status = req.get("status")
        const content = req.get("content") || "application/json";

        res.set("content-type", content);
        res.send(status, response);
    }
}

module.exports = LifeforcePlugin;