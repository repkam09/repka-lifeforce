const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class RuneScape extends LifeforcePlugin {
  constructor(restifyserver, logger, name) {
    super(restifyserver, logger, name);
    this.apiMap = [
      {
        path: "/api/runescape/stats/:username",
        type: "get",
        handler: handleRsMetericsPlayerInfo
      }
    ];
    this.request = require("request");
  }
}

function handleRsMetericsPlayerInfo(req, res, next) {
  if (req.params.username) {
    let url =
      "https://apps.runescape.com/runemetrics/profile/profile?user=" +
      req.params.username +
      "&activities=20";
    this.request.get(url).pipe(res);
  } else {
    res.send(400);
  }
}

module.exports = RuneScape;
