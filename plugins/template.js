const LifeforcePlugin = require("../utils/LifeforcePlugin.js");


class Template extends LifeforcePlugin {
    constructor(server, logger, name) {
        super(server, logger, name);
        this.apiMap = [
            {
                path: "/api/example/example",
                type: "get",
                handler: handleExampleFunction
            }
        ];
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
    }
}

function handleExampleFunction(req, res, next) {

}

module.exports = Template;