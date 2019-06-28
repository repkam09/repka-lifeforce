const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");
const path = require("path");
const trans = require("transmission");

let pathfix = "";

class RepCast extends LifeforcePlugin {
  constructor(restifyserver, logger, name) {
    super(restifyserver, logger, name);
    this.apiMap = [
      {
        path: "/repcast/dirget/:filepath",
        type: "get",
        handler: handleRepcastDirGet
      },
      {
        path: "/repcast/toradd/:magnet",
        type: "get",
        handler: handleRepcastTorAdd
      }
    ];

    // Grab some specific values from the config
    this.settings = this.config.torrent;
    pathfix = this.config.mediamount;
  }
}

function handleRepcastDirGet(req, res, next) {
  // This call has been disabled as the new repcast is active now
  res.send(200, {
    result: [
      {
        name: "Please Update RepCast",
        type: "dir",
        path: "/",
        cast: false,
        video: false,
        path64: "Lw=="
      }
    ]
  });

  return next();
}

function handleRepcastTorAdd(req, res, next) {
  var magnet = new Buffer(req.params.magnet, "base64").toString();
  this.log.verbose("Request on toradd for " + magnet);

  var instance = new trans({
    port: this.settings.port,
    host: this.settings.host,
    username: this.settings.username,
    password: this.settings.password
  });
  instance.addUrl(magnet, {}, function(err, result) {
    if (err) {
      console.log(err);
      res.send(400, err);
    } else {
      var id = result.id;
      res.send(200, { torrentid: id });
    }
  });
}

function filelist(path, ftype) {
  var list = walk(path);
  list = list.filter(element => {
    if (element.endsWith(ftype)) {
      return true;
    }
  });

  list = list.map(element => {
    return element.replace(pathfix, "");
  });
  return list;
}

var walk = function(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + "/" + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else results.push(file);
  });
  return results;
};

function dirlist(filepath) {
  // get the list of files in this directory:
  var files = fs.readdirSync(filepath);

  files.sort(function(a, b) {
    return (
      fs.statSync(filepath + b).mtime.getTime() -
      fs.statSync(filepath + a).mtime.getTime()
    );
  });

  var filelist = [];

  files.forEach(function(file) {
    var fixpath = filepath.replace(pathfix, "");

    var pathb64 = new Buffer(fixpath + file).toString("base64");

    var jsonstruct = {
      name: file,
      type: "file",
      path: fixpath + file,
      cast: false,
      video: false
    };

    var stats = fs.statSync(filepath + file);
    // If something is a directory do some extra operations, and include it
    if (stats.isDirectory()) {
      jsonstruct.type = "dir";
      jsonstruct.path = jsonstruct.path + "/";
      jsonstruct.path64 = new Buffer(jsonstruct.path).toString("base64");

      filelist.push(jsonstruct);
    } else {
      // Not a directory. Check if its a castable file type (mp4)
      var pathext = path.extname(filepath + file);
      if (pathext == ".mp4") {
        jsonstruct.cast = true;
        jsonstruct.video = true;
        filelist.push(jsonstruct);
      } else if (pathext == ".mkv" || pathext == ".avi") {
        // This is a video file, but not castable
        jsonstruct.cast = false;
        jsonstruct.video = true;
        filelist.push(jsonstruct);
      } else {
        // For other normal files...
        filelist.push(jsonstruct);
      }
    }
  });

  return filelist;
}

module.exports = RepCast;
