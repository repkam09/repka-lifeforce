const apiMap = [
    {
        path: "/repcast/dirget/:filepath",
        type: "get",
        handler: handleRepcastDirGet
    },
    {
        path: "/repcast/fileget/:type",
        type: "get",
        handler: handleRepcastFileTypeGet
    },
    {
        path: "/repcast/torsearch/:search",
        type: "get",
        handler: handleRepcastTorSearch
    },
    {
        path: "/repcast/toradd/:magnet",
        type: "get",
        handler: handleRepcastTorAdd
    },

];

class Template {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
    }
}

function handleRepcastDirGet(req, res, next) {
    var getpath = new Buffer(req.params.filepath, 'base64').toString();
    log.verbose("Requested directory listing for " + getpath);
    res.send(200, { result: dirlist(pathfix + getpath) });
    return next();
}

function handleRepcastFileTypeGet(req, res, next) {
    var ftype = "." + req.params.type; //new Buffer(req.params.type, 'base64').toString();
    if (ftype === "") {
        res.send(200, { result: [] });
        return next();
    } else {
        log.verbose("Requested listing for file type " + ftype);

        var list = filelist(pathfix, ftype);

        // Go through the list checking that the file ends in type

        res.send(200, { result: list });
        return next();
    }
}

function handleRepcastTorSearch(req, res, next) {
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
}

function handleRepcastTorAdd(req, res, next) {
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
}

function filelist(path, ftype) {
    var list = walk(path);
    list = list.filter((element) => {
        if (element.endsWith(ftype)) {
            return true;
        }
    });

    list = list.map((element) => {
        return element.replace(pathfix, "");
    });
    return list;
}

var walk = function (dir) {
    var results = []
    var list = fs.readdirSync(dir)
    list.forEach(function (file) {
        file = dir + '/' + file
        var stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walk(file))
        else results.push(file)
    })
    return results
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

module.exports = Template;