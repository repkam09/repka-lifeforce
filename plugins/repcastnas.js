const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const exampleRepcast = require("../static/example_repcast.json");
const restify = require("restify");
const cache = require("../utils/cache");
const fs = require("fs");
const querystring = require("querystring");
const mimetype = require("mime-types");
const path = require("path");

let pathfix = "";
let pathprefix = "";
let authkey = null;

class RepCastNAS extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/repcast/nas/getfiles/:filepath",
                type: "get",
                handler: handleRepcastDirGet,
                cacheTTL: 86400
            },
            {
                path: "/repcast/clearcache",
                type: "get",
                handler: handleResetCache
            },
            {
                path: "/repcast/nas/getfiles",
                type: "get",
                handler: handleRepcastDirGet,
                cacheTTL: 86400
            },
            {
                path: "/repcast/spaces/getfiles",
                type: "get",
                handler: handleRepcastDirGet,
                cacheTTL: 86400
            },
            {
                path: "/repcast/spaces/getfiles/:filepath",
                type: "get",
                handler: handleRepcastDirGet,
                cacheTTL: 86400
            }
        ];

        // Grab some specific values from the config
        pathfix = this.config.mediamount;
        pathprefix = this.config.mediaprefix;
        authkey = this.config.authkey.REPCAST_APP_KEY;

        restifyserver.use((req, res, next) => {
            if (req.url.indexOf("/repcast/filesrv/") === 0) {
                if (req.url.indexOf("auth=" + authkey) !== -1) {
                    return next();
                } else {
                    this.log.info("Got a request for file without correct auth! How did someone get this path?");
                    res.send(401);
                }
            }

            return next();

        });

        restifyserver.get("/repcast/filesrv/*", restify.plugins.serveStaticFiles(this.config.mediamount))
    }
}

function handleResetCache(req, res, next) {
    cache.deleteCacheKeysByPrefix("/repcast/nas/getfiles/*").then(() => {
        res.send(200, "OK");
    })
}

function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}


function handleRepcastDirGet(req, res, next) {
    const header = req.headers["repka-repcast-token"];
    if (!header) {
        this.log.warn("Repcast getfiles request without auth, sending back example file list");
        res.send(200, exampleRepcast);
        return;
    } else {
        if (header !== authkey) {
            res.send(200, exampleRepcast);
            return;
        }
    }

    let getpath = "";
    if (req.params.filepath) {
        getpath = Buffer.from(req.params.filepath, 'base64').toString();
        getpath = getpath.replace(pathfix, "");
    }

    let filepath = pathfix + getpath;
    this.log.info("Requested directory listing for " + filepath + ", getting live data");

    try {
        const result = dirlist(filepath);
        return this.setResponse(res, next, 200, { error: false, status: "live", count: result.length, info: result });
    } catch (err) {
        return this.setResponse(res, next, 500, { error: true, status: "error", count: 0, info: [], details: "Error while getting file list" });
    }
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

    // Strip bad files from the list before even processing them
    files = files.filter((file) => {

        if (file.startsWith(".")) {
            return false;
        }

        if (file.startsWith("@eaDir")) {
            return false;
        }

        return true;
    })


    files.sort(function (a, b) {
        return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
        //return fs.statSync(filepath + b).mtime.getTime() - fs.statSync(filepath + a).mtime.getTime();
    });

    let filelist = [];

    files.forEach((file) => {
        let fixpath = filepath.replace(pathfix, "");

        let jsonstruct = {
            date: "",
            name: file,
            type: "file"
        };

        let stats = fs.statSync(filepath + file);
        // If something is a directory do some extra operations, and include it
        if (stats.isDirectory()) {
            jsonstruct.type = "dir";
            jsonstruct.key = Buffer.from(fixpath + file + "/").toString('base64');
        } else {
            let ext = path.extname(fixpath + file).replace(".", "");
            let fullpath = pathprefix + querystring.escape(fixpath + file) + "?auth=" + authkey;
            jsonstruct.path = fullpath;
            jsonstruct.size = stats.size;
            jsonstruct.original = file;
            jsonstruct.mimetype = mimetype.lookup(ext);
            jsonstruct.filetype = ext;
            jsonstruct.key = "";

            try {
                jsonstruct.date = timeSince(stats.mtimeMs);
            } catch (err) {
                // Ignore that we cant get a proper date
            }
        }

        filelist.push(jsonstruct);

    });

    return filelist;
}

module.exports = RepCastNAS;