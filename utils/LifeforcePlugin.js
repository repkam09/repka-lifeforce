const hasSecureHeader = require("./secure.js").hasSecureHeader;
const isLoggedIn = require("./secure.js").isLoggedIn;

class LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.restifyserver = restifyserver;
        this.name = name;
        this.hasSecureHeader = hasSecureHeader;
        this.isLoggedIn = isLoggedIn;
    }

    addHandlers() {
        for (var i = 0; i < this.apiMap.length; i++) {
            var item = this.apiMap[i];
            var path = item.path;
            var type = item.type.toUpperCase();
            this.log.info("" + type + " - " + path + "", this.name);
            this.restifyserver[item.type](item.path, item.handler.bind(this));
            this.restifyserver.updateAbout({ method: type, path: path, });
        }
    }
}

module.exports = LifeforcePlugin;