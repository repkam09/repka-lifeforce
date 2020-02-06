const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

const pageview = {};

class Analytics extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/analytics/track/:pageid",
                type: "get",
                handler: handleAnalyticsHit
            },
            {
                path: "/api/analytics/view/hits",
                type: "get",
                handler: handleAnalyticsHitView
            }
        ];

    }
}

function handleAnalyticsHitView(req, res, next) {
    res.send(200, pageview);
}

function handleAnalyticsHit(req, res, next) {
    if (req.params.pageid) {
        let page = req.params.pageid;
        if (!pageview[page]) {
            pageview[page] = 0;
        }

        let previous = pageview[page];
        pageview[page] = (previous + 1);
    }

    res.send(200);
}

module.exports = Analytics;