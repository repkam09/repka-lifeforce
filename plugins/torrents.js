const log = require("../utils/logger");

function addHandlers(server) {

}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: false,
    name: "torrents",
    start: (server) => {
        addHandlers(server);
    }
}
