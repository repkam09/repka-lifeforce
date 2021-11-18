const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class RuneScape extends LifeforcePlugin {
  constructor(restifyserver, logger, name) {
    super(restifyserver, logger, name);
    this.apiMap = [
      {
        path: "/api/runescape/stats/:username",
        type: "get",
        handler: handleRsMetericsPlayerInfo,
        cacheTTL: 43200
      }
    ];
    this.request = require("request");
  }
}

function handleRsMetericsPlayerInfo(req, res, next) {
  if (req.params.username) {
    let url = "https://apps.runescape.com/runemetrics/profile/profile?user=" + req.params.username + "&activities=20";
    this.request.get(url, (err, response, body) => {
      if (err) {
        return this.setResponse(req, next, 500, err.message);
      }

      let parsed = JSON.parse(body);

      if (response.statusCode === 200) {
        return this.setResponse(req, next, 200, parsed);
      }

      return this.setResponse(req, next, 500, "Unexpected Response");
    });
  } else {
    return this.setResponse(req, next, 400, "Bad Request");
  }
}

module.exports = RuneScape;
