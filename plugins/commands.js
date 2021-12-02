const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const { execSync } = require('child_process');

const commands = {
    "rosiecraft": {
        cmd: "docker logs rosiecraft",
        timeout: 5000
    },
    "diskspace": {
        cmd: "df -h /",
        timeout: 5000
    }
}

class Commands extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/commands/:key",
                type: "get",
                handler: handleRunCommand,
                cacheTTL: 120
            }
        ];

    }
}

function handleRunCommand(req, res, next) {
    const header = req.headers["repka-repcast-token"];
    if (!header || (header !== authkey)) {
        res.send(401, "Bad Auth");
        return;
    }

    const key = req.params.key;
    if (!commands[key]) {
        res.send(404, "Not Found: " + key);
        return;
    }

    const cmd = commands[key].cmd;
    try {
        const stdout = execSync(cmd);
        return this.setResponse(req, next, 200, stdout, "plain/text");
    } catch (err) {
        return "Error: " + key + ": " + err.message;
    }
}

module.exports = Commands;