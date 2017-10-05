const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

const serverhostname = "http://localhost:16001";
//const serverhostname = "https://api.repkam09.com";

class MetaEndpoints extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/about",
                type: "get",
                handler: handleAboutApi
            },
            {
                path: "/",
                type: "get",
                handler: handleAboutApi
            }
        ];
    }
}

function handleAboutApi(req, res, next) {
    var apis = [];
    var keys = Object.keys(this.restifyserver.router.mounts);
    keys.forEach((key) => {
        var current = this.restifyserver.router.mounts[key];
        apis.push({ path: serverhostname + current.spec.path, method: current.method });
    });
    res.send(200, apis);
}

module.exports = MetaEndpoints;