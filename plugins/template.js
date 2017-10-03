const apiMap = [
    {
        path: "/api/example/example",
        type: "get",
        handler: handleExampleFunction
    }
];

class Template {
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

function handleExampleFunction(req, res, next) {
    
}

module.exports = Template;