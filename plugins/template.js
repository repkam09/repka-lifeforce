const LifeforcePlugin = require("../utils/LifeforcePlugin.js");


class Template extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/example/example",
                type: "get",
                handler: handleExampleFunction
            }
        ];
    }
}

function handleExampleFunction(req, res, next) {

}

module.exports = Template;