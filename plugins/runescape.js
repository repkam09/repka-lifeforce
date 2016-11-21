const log = require("../utils/logger");
const request = require("request");

function addHandlers(server) {
    server.get("/api/runescape/rs3/current/:username", (req, res, next) => {
        if (req.params.username) {
            let url = "http://hiscore.runescape.com/index_lite.ws?player=" + req.params.username;
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

    server.get("/api/runescape/osrs/current/:username", (req, res, next) => {
        if (req.params.username) {
            let url = "http://services.runescape.com/m=hiscore_oldschool/index_lite.ws?player=" + req.params.username;
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });
}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "runescape",
    start: (server) => {
        addHandlers(server);
    }
}