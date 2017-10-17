const LifeforcePlugin = require("../utils/LifeforcePlugin.js");


class Torque extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/torque/log",
                type: "post",
                handler: handleTorquePost
            },
	    {
		path: "/api/torque/log",
		type: "get",
		handler: handleTorqueGet
	    }
        ];
    }
}

function handleTorquePost(req, res, next) {
    this.log.info("Got a torque post request");
    if (req.body) {
        this.log.special(req.body);
    }

    if (req.params) {
        this.log.special(req.params);
    }

    res.send(200, "OK!");
}

function handleTorqueGet(req, res, next) {
    this.log.info("Got a torque get request");
    res.send(200, "OK!");
}

module.exports = Torque;
