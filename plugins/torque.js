const LifeforcePlugin = require("../utils/LifeforcePlugin.js");


class Torque extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/torque/log",
                type: "post",
                handler: handleTorquePost
            }
        ];
    }
}

function handleTorquePost(req, res, next) {
    if (req.body) {
        this.log.special(req.body);
    }

    if (req.params) {
        this.log.special(req.params);
    }

    res.send(200, "OK!");
}

module.exports = Torque;