const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");

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
        return new Promise((resolve, reject) => {
            var params = {
                localFile: localPath,

                s3Params: {
                    Bucket: "repcast",
                    Key: remotePath
                },
            };

            var uploader = this.doclient.uploadFile(params);

            uploader.on('error', function (err) {
                reject(err.message);
            });

            uploader.on('end', function () {
                resolve();
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

module.exports = SpacesS3;