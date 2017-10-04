const log = require("../utils/logger");
const config = require("../config.json");
const fs = require("fs");
const s3 = require("s3");

var doclient = s3.createClient({
    s3Options: {
        accessKeyId: config.digitalocean.accessKey,
        secretAccessKey: config.digitalocean.secretKey,
        endpoint: "https://" + config.digitalocean.endpoint
    }
});

function uploadItem(localPath, remotePath) {
    return new Promise((resolve, reject) => {
        var params = {
            localFile: localPath,

            s3Params: {
                Bucket: "repcast",
                Key: remotePath
            },
        };

        var uploader = doclient.uploadFile(params);

        uploader.on('error', function (err) {
            reject(err.message);
        });

        uploader.on('end', function () {
            resolve();
        });
    });
}

function addHandlers(server) {
    server.post("/api/spaces/upload", (req, res, next) => {
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
    });
}


/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "dospaces",
    start: (server) => {
        addHandlers(server);
    }
}
