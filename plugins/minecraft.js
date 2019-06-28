const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

class Minecraft extends LifeforcePlugin {
  constructor(restifyserver, logger, name) {
    super(restifyserver, logger, name);
    this.apiMap = [
      {
        path: "/api/minecraft/srv/:serverurl",
        type: "get",
        handler: handleMinecraftServerStatus
      }
    ];
    this.request = require("request");
  }
}

function handleMinecraftServerStatus(req, res, next) {
  if (req.params.serverurl) {
    let url = "https://api.mcsrvstat.us/2/" + req.params.serverurl;
    this.request.get(url).pipe(res);
  } else {
    res.send(400);
  }
}

module.exports = Minecraft;
