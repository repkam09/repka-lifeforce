const log = require("../utils/logger");

function addHandlers(server) {
    log.debug("Adding handler for about api get request");
    server.get("/api/about", (req, res, next) => {
        var apis = [];
        var keys = Object.keys(server.router.mounts);
        keys.forEach((key) => {
            var current = server.router.mounts[key];
            apis.push({ path: "https://api.repkam09.com" + current.spec.path, method: current.method });
        });

        res.send(200, apis);
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "utils",
    start: (server) => {
        addHandlers(server);
    }
}