const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class DebugRequests extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "\/api\/debug\/wildcard\/*",
                type: "get",
                handler: handleDebugRequestWildcard
            },
            {
                path: "\/api\/debug\/wildcard\/*",
                type: "post",
                handler: handleDebugRequestWildcard
            },
            {
                path: "\/api\/debug\/wildcard\/*",
                type: "put",
                handler: handleDebugRequestWildcard
            },
            {
                path: "/api/debug/response/:code",
                type: "get",
                handler: handleDebugRequestCode
            },
            {
                path: "/api/debug/response/:code",
                type: "post",
                handler: handleDebugRequestCode
            }
        ];
    }
}

function handleDebugRequestCode(req, res, next) {
    if (req) {
        let code = 200;

        let response = {
            code: code,
            body: null,
            params: req.params,
            url: req.url,
            method: req.method,
            headers: req.headers
        };

        if (req.params.code) {
            try {
                code = Number.parseInt(req.params.code);
                response.code = code;
            } catch (err) {
                code = 500;
                response.code = code;
            }
        }

        if (req.body) {
            try {
                response.body = req.body;
            } catch (err) {
                response.body = "parse_error";
            }
        }

        res.send(code, response);
        return next();
    } else {
        res.send(500, "Actual Error");
    }
}

function handleDebugRequestWildcard(req, res, next) {
    let response = {
        code: 200,
        params: req.params,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    }

    try {
        console.log("");
        console.log("Request: " + req.method + " " + req.url);
        console.log("Headers:" + JSON.stringify(req.headers));
        console.log("Params: " + JSON.stringify(req.params));
        console.log("Body: " + JSON.stringify(req.body));
        console.log("");
    } catch (err) {
        console.log("Unable to stringify debug request data");
    }

    res.send(200, response);
    return next();
}

module.exports = DebugRequests;
