const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");
const mimetype = require('mime-types');

let uploadInProgress = false;
let uploadQueue = [];

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};


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
                path: "/repcast/spaces/getfiles/:pathid",
                type: "get",
                handler: handleGetSpacesFileList

            },
            {
                path: "/repcast/spaces/getfiles",
                type: "get",
                handler: handleGetSpacesFileList

            },
            {
                path: "/repcast/youtube/:videoid",
                type: "get",
                handler: handleYoutubeDownload
            },
        ];

        const AWS = require('aws-sdk');
        this.s3 = require("s3");


        const spacesEndpoint = new AWS.Endpoint(this.config.digitalocean.endpoint);
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

                // Remove any file that does not have a size above zero
                itemlist = itemlist.filter((item) => {
                    if (item.Size > 0) {
                        return true;
                    } else {
                        return false;
                    }
                });

                resolve(itemlist);
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
        var videoinfo = null;
        var video = this.youtubedl('http://www.youtube.com/watch?v=' + req.params.videoid,
            [],
            { cwd: __dirname });

        // Will be called when the download starts.
        video.on('info', (info) => {
            videoinfo = info;
            res.send(200, { error: false, info });
        });

        video.on('end', (res) => {
            this.log.info("Video download finished, starting upload to Spaces...");
            // Rename the video to something better...
            var newFilePath = "./temp/" + videoinfo.filename;
            move(filepath, newFilePath).then((result) => {
                var spacesName = "repcast/yt_dl_" + videoinfo.filename
                this.log.info("Upload as " + spacesName);
                this.uploadItem(newFilePath, spacesName).then(() => {
                    this.log.info("Video upload to Spaces finished!");
                    fs.unlink(newFilePath, () => {
                        this.log.info("Deleted temp local video file");
                    });
                }).catch((error) => {
                    this.log.info("Video upload to Spaces failed!");
                });
            });
        });

        video.pipe(fs.createWriteStream(filepath));
    } else {
        res.send(400, { error: "bad request" });
    }
    next();
}

function move(oldPath, newPath) {
    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', (err) => {
            reject(err);
        });

        writeStream.on('error', (err) => {
            reject(err);
        });

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
            resolve();
        });

        readStream.pipe(writeStream);
    }

    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
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

function handleGetSpacesFileList(req, res, next) {
    let pathid = "";
    if (req.params.pathid) {
        pathid = req.params.pathid;
    }

    pathid = new Buffer(pathid, 'base64').toString('ascii');

    console.log("Looking at directory prefix " + pathid);
    let prefix = "repcast/" + pathid;
    let that = this;
    this.listItems(prefix).then((itemlist) => {
        let filelist = [];

        itemlist = itemlist.map((file) => {
            var hashString = file.ETag;
            if (hashString.charAt(0) === '"' && hashString.charAt(hashString.length - 1) === '"') {
                hashString = (hashString.substr(1, hashString.length - 2));
            }

            const expireSeconds = 172800;

            const urlpath = that.s3auth.getSignedUrl('getObject', {
                Bucket: 'repcast',
                Key: file.Key,
                Expires: expireSeconds
            });

            // Get the file type
            let filetype = file.Key.split('.').pop();

            // Improve the names and paths
            let nameParts = file.Key.split("/");
            let namePath = "";

            let isDirectory = false;
            if (nameParts.length > 2) {
                //This has a directory. Add the directory thing to the thing but not the file...
                namePath = nameParts[1] + "/";
                isDirectory = true;
            }

            if (prefix != "repcast/") {
                isDirectory = false;
            }

            let name = namePath + nameParts.pop();

            // Convert the name to something nicer looking
            let removesstring = ["720p", "x264", "AAC", "ETRG", "BRRip", "WEB-DL", "H264", "AC3", "EVO",
                "rarbg", "HDTV", "W4F", "hdtv", "w4f", "ETRG", "YIFY", "1080p", "BluRay", "DVDRip"];

            removesstring.map((rmstr) => {
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

            let filestruct = {
                size: file.Size,
                time: file.LastModified,
                name: name,
                original: file.Key,
                path: urlpath,
                hash: hashString,
                type: "file",
                mimetype: mtype,
                filetype: filetype,
                thumb: "https://repkam09.com/img/file.png"
            };


            if (!isDirectory) {
                // Check for invalid file types
                var invalid = ["txt", "nfo", "srt", "jpg", "png", "jpeg", "sfv", "ico", "PNG", "sh", "tmp"];
                if (invalid.indexOf(filestruct.filetype) < 0) {
                    filelist.push(filestruct);
                }
            } else {
                // If the thing is a directory...
                filestruct.type = "dir";
                filestruct.key = new Buffer(namePath).toString('base64');;
                filestruct.name = namePath;
                delete filestruct.original;
                delete filestruct.hash;
                delete filestruct.mimetype;
                delete filestruct.filetype;
                delete filestruct.size;
                delete filestruct.path;


                // Check if the dir is already in the list
                let alreadyInList = false;
                filelist.map((list) => {
                    if (list.name == filestruct.name) {
                        alreadyInList = true;
                    }
                });

                if (!alreadyInList) {
                    filelist.push(filestruct);
                }
            }
        });

        // Sort the list by access time
        filelist.sort((a, b) => {
            return b.time - a.time
        });

        // Create an object to return
        const response = { error: false, count: filelist.length, info: filelist };

        res.send(200, response);
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
