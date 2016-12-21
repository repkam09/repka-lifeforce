const log = require("../utils/logger");
const tpb = require('thepiratebay');
const trans = require('transmission');
const path = require('path');
const fs = require("fs");
const os = require('os');
const config = require('../config.json');

// Grab some specific values from the config
const settings = config.torrent;
const pathfix = config.mediamount;
const logpath = config.logpath;

function addHandlers(server) {
    server.get('/repcast/dirget/:filepath', function (req, res, next) {
        var getpath = new Buffer(req.params.filepath, 'base64').toString();
        log.verbose("Requested directory listing for " + getpath);
        res.send(200, { result: dirlist(pathfix + getpath) });
        return next();
    });

    server.get('/repcast/torsearch/:search', function (req, res, next) {
        var searchterm = new Buffer(req.params.search, 'base64').toString();
        log.verbose("torrent serarch for : " + searchterm);

        var test = tpb.search(searchterm).then((results) => {
            log.verbose("torrent serarch results: " + JSON.stringify(results));
            var obj = {};
            obj.query = searchterm;
            obj.count = results.length;
            obj.torrents = results;
            res.send(200, obj);
        }).catch((error) => {
            log.error("Got an error for " + searchterm);
            var obj = {};
            obj.count = 0;
            obj.query = "Error Searching TPB";
            obj.torrents = [];
            res.send(500, obj);
        });
    });

    server.get('/repcast/toradd/:magnet', function (req, res, next) {
        var magnet = new Buffer(req.params.magnet, 'base64').toString();
        log.verbose("Request on toradd for " + magnet);

        var instance = new trans({ port: settings.port, host: settings.host, username: settings.username, password: settings.password });
        instance.addUrl(magnet, {}, function (err, result) {
            if (err) {
                console.log(err);
                res.send(400, err);
            } else {
                var id = result.id;
                res.send(200, { torrentid: id });
            }
        });
    });
}


function dirlist(filepath) {
    // get the list of files in this directory:
    var files = fs.readdirSync(filepath);

    files.sort(function (a, b) {
        return fs.statSync(filepath + b).mtime.getTime() - fs.statSync(filepath + a).mtime.getTime();
    });

    var filelist = [];

    files.forEach(function (file) {
        var fixpath = filepath.replace(pathfix, "");

        var pathb64 = new Buffer(fixpath + file).toString('base64');

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
            jsonstruct.path64 = new Buffer(jsonstruct.path).toString('base64');

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



/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "torrents",
    start: (server) => {
        addHandlers(server);
    }
}
