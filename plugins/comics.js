const log = require("../utils/logger");
const request = require("request");

function addHandlers(server) {
    server.get("/api/comics/qc/:number", (req, res, next) => {
	if (req.params.number) {
	    let url = "http://www.questionablecontent.net/comics/" + req.params.number + ".png";
            request.get(url).pipe(res);
	} else {
            res.send(400);
	}
    });

    server.get("/api/comics/sa/:number", (req, res, next) => {
        if (req.params.number) {
            let url = "http://www.collectedcurios.com/SA_" + req.params.number + "_small.jpg";
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
    name: "comics",
    start: (server) => {
        addHandlers(server);
    }
}
