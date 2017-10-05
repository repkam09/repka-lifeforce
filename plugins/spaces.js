const fs = require("fs");

const apiMap = [
    {
        path: "/api/spaces/upload",
        type: "post",
        handler: handleSpacesUpload
    }
];

class SpacesS3 {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
        this.s3 = require("s3");

        this.doclient = this.s3.createClient({
            s3Options: {
                accessKeyId: this.config.digitalocean.accessKey,
                secretAccessKey: this.config.digitalocean.secretKey,
                endpoint: "https://" + this.config.digitalocean.endpoint
            }
        });
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
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

        uploadItem(path, "personal/" + data.name).then(() => {
            // Delete the temp file
            console.log("temp file for s3 upload: " + path);
            // Respond to the client that upload completed
            res.send(200, { upload: true });
        }).catch((error) => {
            res.send(400, { filename: false });
        })
    } else {
        res.send(400, { filename: false });
    }

    next();
}

module.exports = SpacesS3;