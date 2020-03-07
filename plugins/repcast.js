const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");
const mimetype = require("mime-types");
const trans = require('transmission');
const exampleRepcast = require("../static/example_repcast.json");

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

class SpacesS3 extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/youtube/download/:videoid",
                type: "get",
                handler: handleYoutubeDownload
            },
            {
                path: "/repcast/youtube/:videoid",
                type: "get",
                handler: handleYoutubeDownload
            },
            {
                path: "/repcast/toradd/:magnet",
                type: "get",
                handler: handleRepcastTorAdd
            },
            {
                path: "/repcast/spaces/getfiles",
                type: "get",
                handler: handleGetSpacesFileListSecure
            },
            {
                path: "/repcast/spaces/getfiles/:pathid",
                type: "get",
                handler: handleGetSpacesFileListSecure
            },
            {
                path: "/repcast/spaces/getfilessecure",
                type: "get",
                handler: handleGetSpacesFileListSecure
            },
            {
                path: "/repcast/spaces/getfilessecure/:pathid",
                type: "get",
                handler: handleGetSpacesFileListSecure
            },
            {
                path: "/repcast/spaces/getfilestest",
                type: "get",
                handler: handleGetSpacesFileListExample
            },
            {
                path: "/repcast/spaces/getfilestest/:pathid",
                type: "get",
                handler: handleGetSpacesFileListExample
            },
            {
                path: "/repcast/spaces/getfilesraw",
                type: "get",
                handler: handleGetSpacesFileListRawSecure
            },
            {
                path: "/repcast/spaces/clearcache",
                type: "get",
                handler: handleInvalidateSpacesCache
            }
        ];

        try {
            const AWS = require("aws-sdk");
            this.s3 = require("s3");

            if (!this.config) {
                logger.warn("Missing config");
            }

            if (!this.config.digitalocean) {
                logger.warn("Missing config digitalocean");
            }

            if (!this.config.digitalocean.endpoint) {
                logger.warn("Missing config digitalocean endpoint");
            }

            if (!this.config.digitalocean.accessKey) {
                logger.warn("Missing config digitalocean accessKey");
            }

            if (!this.config.digitalocean.secretKey) {
                logger.warn("Missing config digitalocean secretKey");
            }


            const spacesEndpoint = new AWS.Endpoint(
                this.config.digitalocean.endpoint
            );
            this.s3auth = new AWS.S3({
                endpoint: spacesEndpoint,
                accessKeyId: this.config.digitalocean.accessKey,
                secretAccessKey: this.config.digitalocean.secretKey
            });

            this.doclient = this.s3.createClient({
                s3Options: {
                    accessKeyId: this.config.digitalocean.accessKey,
                    secretAccessKey: this.config.digitalocean.secretKey,
                    endpoint: "https://" + this.config.digitalocean.endpoint
                }
            });
        } catch (err) {
            logger.warn("Unable to start up aws functions: " + err.message, "SpacesS3");
        }

        //this.youtubedl = require("youtube-dl");
        this.settings = this.config.torrent;

        // Create an object to hold file cache information in
        this.fileListCache = {};

        // Start up a timer to reset the file cache if needed
        this.clearFileListCacheTimer = setInterval(() => {
            console.log(
                "Cleaning up the file cache, new pull required for next request"
            );
            this.fileListCache = {};
        }, 900000);
    }

    uploadItem(localPath, remotePath) {
        let that = this;
        return new Promise((resolve, reject) => {
            var params = {
                localFile: localPath,

                s3Params: {
                    Bucket: "repcast",
                    Key: remotePath
                }
            };

            var uploader = that.doclient.uploadFile(params);

            uploader.on("error", function (err) {
                reject(err.message);
            });

            uploader.on("end", function () {
                resolve();
            });
        });
    }

    listItems(prefix) {
        var that = this;
        return new Promise((resolve, reject) => {
            // Check the cache to see if this request has already been made before with this prefix
            if (that.fileListCache[prefix]) {
                console.log("Using cached response for " + prefix);
                resolve({ itemlist: that.fileListCache[prefix], status: "cache" });
            } else {
                // If this request has not been made before, we'll have to go out to the server for it
                var list = this.doclient.listObjects({
                    s3Params: {
                        Prefix: prefix,
                        Bucket: "repcast"
                    }
                });

                list.on("error", function (err) {
                    reject(err.stack);
                });

                var itemlist = [];
                list.on("data", function (data) {
                    data.Contents.map(item => {
                        itemlist.push(item);
                    });
                });

                list.on("end", function () {
                    // Remove any file that does not have a size above zero
                    itemlist = itemlist.filter(item => {
                        if (item.Size > 0) {
                            return true;
                        } else {
                            return false;
                        }
                    });

                    that.fileListCache[prefix] = itemlist;
                    resolve({ size: itemlist.length, itemlist, status: "live" });
                });
            }
        });
    }
}

function handleRepcastTorAdd(req, res, next) {
    var magnet = new Buffer(req.params.magnet, 'base64').toString();
    this.log.verbose("Request on toradd for " + magnet);

    var instance = new trans({ port: this.settings.port, host: this.settings.host, username: this.settings.username, password: this.settings.password });
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

function handleYoutubeDownload(req, res, next) {
    return res.send(200, { error: false });

    if (req.params.videoid) {
        var filepath = "./temp/yt_dl_" + req.params.videoid + ".mp4";
        var videoinfo = null;

        res.send(200, { error: false, info: "OK!" });
        var video = this.youtubedl(
            "http://www.youtube.com/watch?v=" + req.params.videoid,
            [],
            { cwd: __dirname }
        );

        // Will be called when the download starts.
        video.on("info", info => {
            videoinfo = info;
            //res.send(200, { error: false, info });
        });

        video.on("end", res => {
            this.log.info("Video download finished, starting upload to Spaces...");
            // Rename the video to something better...
            var newFilePath = "./temp/" + videoinfo.filename;
            move(filepath, newFilePath).then(result => {
                var spacesName = "repcast/YouTube/" + videoinfo.filename;
                this.log.info("Upload as " + spacesName);
                this.uploadItem(newFilePath, spacesName)
                    .then(() => {
                        this.log.info("Video upload to Spaces finished!");
                        fs.unlink(newFilePath, () => {
                            this.log.info("Deleted temp local video file");

                            // Reset the cache of file list. There is a new file!
                            this.fileListCache = {};
                        });
                    })
                    .catch(error => {
                        this.log.info("Video upload to Spaces failed!");
                    });
            });
        });

        video.pipe(fs.createWriteStream(filepath));
    } else {
        //res.send(400, { error: "bad request" });
    }
    next();
}

function move(oldPath, newPath) {
    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on("error", err => {
            reject(err);
        });

        writeStream.on("error", err => {
            reject(err);
        });

        readStream.on("close", function () {
            fs.unlink(oldPath, callback);
            resolve();
        });

        readStream.pipe(writeStream);
    }

    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === "EXDEV") {
                    copy();
                } else {
                    reject(err);
                }
                return;
            }
            resolve();
        });
    });
}

function handleInvalidateSpacesCache(req, res, next) {
    this.fileListCache = {};
    res.send(200, "OK!");
    next();
}

function handleGetSpacesFileListRawSecure(req, res, next) {
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

    let pathid = "";

    console.log("Looking at directory prefix " + pathid);
    let prefix = "repcast/" + pathid;
    let that = this;
    this.listItems(prefix)
        .then(response => {
            res.send(200, response);
            next();
        })
        .catch(error => {
            res.send(500, { error: true, info: [], count: 0 });
        });
}

function handleGetSpacesFileListSecure(req, res, next) {
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

    let pathid = "";
    if (req.params.pathid) {
        pathid = req.params.pathid;
    }

    pathid = new Buffer.from(pathid, "base64").toString("ascii");

    console.log("Looking at directory prefix " + pathid);
    let prefix = "repcast/" + pathid;
    let that = this;
    this.listItems(prefix)
        .then(response => {
            let itemlist = response.itemlist;
            let status = response.status;
            let filelist = [];

            itemlist = itemlist.map(file => {
                var hashString = file.ETag;
                if (
                    hashString.charAt(0) === '"' &&
                    hashString.charAt(hashString.length - 1) === '"'
                ) {
                    hashString = hashString.substr(1, hashString.length - 2);
                }

                const expireSeconds = 172800;

                const urlpath = that.s3auth.getSignedUrl("getObject", {
                    Bucket: "repcast",
                    Key: file.Key,
                    Expires: expireSeconds
                });

                // Get the file type
                let filetype = file.Key.split(".").pop();

                // Improve the names and paths
                let nameParts = file.Key.split("/");
                let namePath = "";

                let isDirectory = false;
                if (nameParts.length > 2) {
                    //This has a directory. Add the directory thing to the thing but not the file...
                    namePath = nameParts[1] + "";
                    isDirectory = true;
                }

                if (prefix != "repcast/") {
                    isDirectory = false;
                }

                let name;
                if (!isDirectory) {
                    name = nameParts.pop();
                } else {
                    name = namePath + nameParts.pop();
                }

                // Convert the name to something nicer looking
                let removesstring = [
                    "720p",
                    "x264",
                    "AAC",
                    "ETRG",
                    "BRRip",
                    "WEB-DL",
                    "H264",
                    "AC3",
                    "EVO",
                    "rarbg",
                    "HDTV",
                    "W4F",
                    "hdtv",
                    "w4f",
                    "ETRG",
                    "YIFY",
                    "1080p",
                    "BluRay",
                    "DVDRip",
                    "320kbps",
                    "[Hunter]",
                    "1080p",
                    "[]"
                ];

                removesstring.map(rmstr => {
                    name = name.replaceAll("." + rmstr, "");
                    name = name.replaceAll("-" + rmstr, "");
                    name = name.replaceAll(rmstr.toUpperCase(), "");
                    name = name.replaceAll(rmstr.toLowerCase(), "");
                    name = name.replaceAll(rmstr, "");
                });

                let mtype = mimetype.lookup(filetype);
                if (!mtype) {
                    mtype = "application/octet-stream";
                }

                let date_string = "";
                try {
                    let then = new Date(file.LastModified);
                    date_string = timeSince(then) + " ago";
                } catch (err) {
                    console.log("Warn: Unable to parse date string");
                }

                let filestruct = {
                    size: file.Size,
                    time: file.LastModified,
                    date: date_string,
                    name: name,
                    original: file.Key.replace("repcast/", ""),
                    path: urlpath,
                    type: "file",
                    mimetype: mtype,
                    filetype: filetype
                };

                if (!isDirectory) {
                    // Check for invalid file types
                    var invalid = [
                        "txt",
                        "nfo",
                        "srt",
                        "jpg",
                        "png",
                        "jpeg",
                        "sfv",
                        "ico",
                        "PNG",
                        "sh",
                        "tmp",
                        "idx",
                        "sub",
                        "z",
                        "bak"
                    ];

                    if (invalid.indexOf(filestruct.filetype) < 0) {
                        filelist.push(filestruct);
                    }
                } else {
                    // If the thing is a directory...
                    filestruct.type = "dir";
                    filestruct.key = new Buffer.from(namePath).toString("base64");
                    filestruct.name = namePath;
                    delete filestruct.original;
                    delete filestruct.hash;
                    delete filestruct.mimetype;
                    delete filestruct.filetype;
                    delete filestruct.size;
                    delete filestruct.path;

                    // Check if the dir is already in the list
                    let alreadyInList = false;
                    filelist.map(list => {
                        if (list.name == filestruct.name) {
                            alreadyInList = true;

                            // If the time stamp of this dir is newer, replace with this one.
                            if (list.time < filestruct.time) {
                                list.time = filestruct.time;
                            }
                        }
                    });

                    if (!alreadyInList) {
                        filelist.push(filestruct);
                    }
                }
            });

            // Sort the list by access time
            filelist.sort((a, b) => {
                return b.time - a.time;
            });

            filelist = filelist.map(item => {
                // Remove extra properties that add size
                if (item.time) {
                    delete item.time;
                }

                return item;
            });

            // Create an object to return
            const restresponse = {
                error: false,
                status,
                count: filelist.length,
                info: filelist
            };

            res.send(200, restresponse);
            next();
        })
        .catch(error => {
            res.send(500, { error: true, info: [], count: 0, details: error });
        });
}

function handleGetSpacesFileListExample(req, res, next) {
    res.send(200, exampleRepcast);
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

module.exports = SpacesS3;
