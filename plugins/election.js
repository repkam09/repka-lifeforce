const log = require("../utils/logger");
const election_results = require("../static/election_results.json");

function addHandlers(server) {
    server.get("/api/election/full", (req, res, next) => {
        // This used to be dynamic and updated from CNN website, but since election
        // is now over, use a static file to give results. Faster and more reliable since 
        // the information is no longer changing.
        res.send(200, election_results);
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "election",
    start: (server) => {
        addHandlers(server);
    }
}
