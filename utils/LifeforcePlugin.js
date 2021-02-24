const hasSecureHeader = require("./secure.js");

class LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.restifyserver = restifyserver;
        this.name = name;
        this.hasSecureHeader = hasSecureHeader;
    }

    addHandlers(pluginname) {
        for (var i = 0; i < this.apiMap.length; i++) {
            var item = this.apiMap[i];
            var path = item.path;
            var type = item.type.toUpperCase();
            this.log.info("" + type + " - " + path + "", this.name);
            this.restifyserver[item.type](item.path, item.handler.bind(this));
            this.restifyserver.updateAbout({ method: type, path: "https://api.repkam09.com" + path, plugin: pluginname });
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

module.exports = LifeforcePlugin;