const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

const PlayerMap = new Map();

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

    // Check if we have data already in the cache
    if (PlayerMap.has(req.params.username)) {
      this.log.info("Responding from player data cache");
      res.send(200, PlayerMap.get(req.params.username));
      return;
    }


    let url = "https://apps.runescape.com/runemetrics/profile/profile?user=" + req.params.username + "&activities=20";
    this.request.get(url, (err, response, body) => {
      if (err) {
        res.send(500, err.message);
        return;
      }

      if (response.statusCode === 200) {
        this.log.info("Updating player data cache for " + req.params.username);
        PlayerMap.set(req.params.username, body);
        res.send(200, body);
        return
      }

      res.send(response.statusCode, body);
    });
  } else {
    res.send(400);
  }
}

module.exports = RuneScape;
