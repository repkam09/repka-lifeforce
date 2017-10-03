const apiMap = [
    {
        path: "/api/election/full",
        type: "get",
        handler: handleElectionResults
    }
];

class ElectionResults {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;

        this.election_results = require("../static/election_results.json");
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
    }
}

function handleElectionResults(req, res, next) {
    // This used to be dynamic and updated from CNN website, but since election
    // is now over, use a static file to give results. Faster and more reliable since 
    // the information is no longer changing.
    res.send(200, this.election_results);
}

module.exports = ElectionResults;