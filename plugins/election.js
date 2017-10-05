const LifeforcePlugin = require("../utils/LifeforcePlugin.js");



class ElectionResults extends LifeforcePlugin {
    constructor(server, logger, name) {
        super(server, logger, name);
        this.apiMap = [
            {
                path: "/api/election/full",
                type: "get",
                handler: handleElectionResults
            }
        ];
        this.election_results = require("../static/election_results.json");
    }
}

function handleElectionResults(req, res, next) {
    // This used to be dynamic and updated from CNN website, but since election
    // is now over, use a static file to give results. Faster and more reliable since 
    // the information is no longer changing.
    res.send(200, this.election_results);
}

module.exports = ElectionResults;