const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");

class LocalFile extends LifeforcePlugin {
        constructor(restifyserver, logger, name) {
                super(restifyserver, logger, name);
                this.apiMap = [
                        {
                                path: "/api/editor/get/:filename",
                                type: "get",
                                handler: handleExampleFunction
                        }
                ];
        }
}

function handleExampleFunction(req, res, next) {
        if (req.params.filename) {
                const fileData = fs.readFileSync("./" + req.params.filename, "utf8");
                if (fileData) {
                        res.send(200, { language: "javascript", data: fileData });
                } else {
                        res.send(404, "not found");
                }
        } else {
                res.send(400, "bad request");
        }
}

module.exports = LocalFile;

