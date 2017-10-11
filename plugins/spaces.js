const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");
const aws4 = require("aws4");
const aws2 = require("aws2");

let uploadInProgress = false;
let uploadQueue = [];

class SpacesS3 extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/spaces/upload",
                type: "post",
                handler: handleSpacesUpload
            },
            {
                path: "/api/youtube/download/:videoid",
                type: "get",
                handler: handleYoutubeDownload
            },
            {
                path: "/repcast/spaces/getfiles",
                type: "get",
                handler: handleGetSpacesFileList

            },
            {
                path: "/repcast/spaces/sync",
                type: "get",
                handler: handleSyncMediaFiles

            }
        ];

        this.s3 = require("s3");

        this.doclient = this.s3.createClient({
            s3Options: {
                accessKeyId: this.config.digitalocean.accessKey,
                secretAccessKey: this.config.digitalocean.secretKey,
                endpoint: "https://" + this.config.digitalocean.endpoint
            }
        });

        this.youtubedl = require('youtube-dl');
    }

    uploadItem(localPath, remotePath) {
        let that = this;
        return new Promise((resolve, reject) => {
            var params = {
                localFile: localPath,

                s3Params: {
                    Bucket: "repcast",
                    Key: remotePath
                },
            };

            var uploader = that.doclient.uploadFile(params);

            uploader.on('error', function (err) {
                reject(err.message);
            });

            uploader.on('end', function () {
                resolve();
            });
        });
    }

    uploadDirectory() {
        let that = this;
        return new Promise((resolve, reject) => {
            if (!uploadInProgress) {
                uploadInProgress = true;
                var params = {
                    localDir: that.config.syncmount,

                    s3Params: {
                        Bucket: "repcast",
                        Prefix: "repcast/"
                    },
                };

                var uploader = that.doclient.uploadDir(params);

                uploader.on('error', function (err) {
                    uploadInProgress = false;
                    reject(err.message);
                });

                uploader.on('end', function () {
                    uploadInProgress = false;
                    resolve();
                });
            } else {
                that.log.info("Skipping uploadDirectory call as a sync is already in progress");
                resolve();
            }
        });
    }

    listItems(prefix) {
        var that = this;
        return new Promise((resolve, reject) => {
            var list = this.doclient.listObjects({
                s3Params: {
                    Prefix: prefix,
                    Bucket: "repcast"
                }
            });

            list.on('error', function (err) {
                reject(err.message);
            });

            var itemlist = [];
            list.on("data", function (data) {
                data.Contents.map((item) => {
                    itemlist.push(item);
                });
            });

            list.on('end', function () {
                let filelist = [];
                // Remove all the directories from the structure
                itemlist = itemlist.filter((item) => {
                    if (item.Size > 0) {
                        return true;
                    } else {
                        return false;
                    }
                });

                itemlist = itemlist.map((file) => {
                    var hashString = file.ETag;
                    if (hashString.charAt(0) === '"' && hashString.charAt(hashString.length - 1) === '"') {
                        hashString = (hashString.substr(1, hashString.length - 2));
                    }

                    // Create a path that can be used to stream the secured file for 12 hours
                    var opts = {
                        host: 'repcast.' + that.config.digitalocean.endpoint,
                        path: file.Key,
                        signQuery: true
                    };

                    // create a copy of the options
                    var optionsv2 = Object.assign({}, opts);
                    var optionsv4 = Object.assign({}, opts);

                    var signedv4 = aws4.sign(optionsv4, {
                        accessKeyId: that.config.digitalocean.accessKey,
                        secretAccessKey: that.config.digitalocean.secretKey
                    });

                    var signedv2 = aws2.sign(optionsv2, {
                        accessKeyId: that.config.digitalocean.accessKey,
                        secretAccessKey: that.config.digitalocean.secretKey
                    });

                    let filestruct = {
                        size: file.Size,
                        name: file.Key,
                        path: "https://" + opts.host + "/" + opts.path,
                        pathv4: "https://" + opts.host + "/" + signedv4.path,
                        pathv2: "https://" + opts.host + "/" + signedv2.path,
                        hash: hashString
                    };

                    filelist.push(filestruct)
                });

                resolve(filelist);
            });
        });
    }
}

function handleSpacesUpload(req, res, next) {
    if (req.files) {
        var data = req.files.filedata;
        var path = data.path;

        this.uploadItem(path, "personal/" + data.name).then(() => {
            // Delete the temp file
            console.log("temp file for s3 upload: " + path);
            // Respond to the client that upload completed
            res.send(200, { upload: true });
        }).catch((error) => {
            res.send(400, { filename: false });
        });
    } else {
        res.send(400, { filename: false });
    }

    next();
}

function handleYoutubeDownload(req, res, next) {
    if (req.params.videoid) {
        var filepath = "./temp/yt_dl_" + req.params.videoid + ".mp4";
        var video = this.youtubedl('http://www.youtube.com/watch?v=' + req.params.videoid,
            [],
            { cwd: __dirname });

        // Will be called when the download starts.
        video.on('info', (info) => {
            res.send(200, { error: false, info });
        });

        video.on('end', (res) => {
            this.log.info("Video download finished, starting upload to Spaces...")
            this.uploadItem(filepath, "storage/yt_dl_" + req.params.videoid + ".mp4").then(() => {
                this.log.info("Video upload to Spaces finished!");
            }).catch((error) => {
                this.log.info("Video upload to Spaces failed!");
            });
        });

        video.pipe(fs.createWriteStream(filepath));
    } else {
        res.send(400, { error: "bad request" });
    }
    next();
}


function handleGetSpacesFileList(req, res, next) {
    this.listItems("repcast/").then((items) => {
        res.send(200, { error: false, info: items, count: items.length });
        next();
    }).catch((error) => {
        res.send(500, { error: true, info: [], count: 0 });
    });
}

function handleSyncMediaFiles(req, res, next) {
    this.uploadDirectory().then(() => {
        this.log.info("Finished uploading files!");
    }).catch((error) => {
        this.log.info("Error while uploading files!");
    });

    res.send(200, { error: false, info: "upload started" });
}

module.exports = SpacesS3;