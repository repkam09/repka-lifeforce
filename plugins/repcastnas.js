const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const exampleRepcast = require("../static/example_repcast.json");
const fs = require("fs");
const path = require("path");

let pathfix = "";

class RepCastNAS extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/repcast/nas/getfiles/:filepath",
                type: "get",
                handler: handleRepcastDirGet
            },
            {
                path: "/repcast/nas/getfiles",
                type: "get",
                handler: handleRepcastDirGet
            }
        ];

        // Grab some specific values from the config
        pathfix = this.config.mediamount;
    }
}

function handleRepcastDirGet(req, res, next) {
    const header = req.headers["repka-repcast-token"];
    if (!header) {
        res.send(200, exampleRepcast);
        return;
    } else {
        if (header !== this.config.authkey.REPCAST_APP_KEY) {
            res.send(200, exampleRepcast);
            return;
        }
    }

    let getpath = "";
    if (req.params.filepath) {
        getpath = new Buffer(req.params.filepath, 'base64').toString();
        getpath = getpath.replace(pathfix, "");
    }

    let filepath = pathfix + getpath;

    this.log.info("Requested directory listing for " + filepath);
    let result = dirlist(filepath);
    res.send(200, { error: false, status: "live", count: result.length, result: result });
    return next();
}

const walk = (dir) => {
    let results = []
    let list = fs.readdirSync(dir)
    list.forEach((file) => {
        file = dir + '/' + file
        let stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walk(file))
        else results.push(file)
    });

    return results
}

function dirlist(filepath) {
    // get the list of files in this directory:
    let files = fs.readdirSync(filepath);

    files.sort(function (a, b) {
        return fs.statSync(filepath + b).mtime.getTime() - fs.statSync(filepath + a).mtime.getTime();
    });

    let filelist = [];

    files.forEach(function (file) {
        let fixpath = filepath.replace(pathfix, "");

        let jsonstruct = {
            name: file,
            type: "file",
            path: fixpath + file,
        };

        let stats = fs.statSync(filepath + file);
        // If something is a directory do some extra operations, and include it
        if (stats.isDirectory()) {
            jsonstruct.type = "dir";
            jsonstruct.path = jsonstruct.path + "/";
            jsonstruct.path64 = new Buffer(jsonstruct.path).toString('base64');

            filelist.push(jsonstruct);
        } else {
            // Not a directory. Check if its a castable file type (mp4)
            let pathext = path.extname(filepath + file);
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

module.exports = RepCastNAS;