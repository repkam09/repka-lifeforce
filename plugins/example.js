const log = require("../utils/logger");

function addHandlers(server) {
    server.get("/api/example/path", (req, res, next) => {
        res.send(200);
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: false,
    name: "example",
    start: (server) => {
        addHandlers(server);
    }
}