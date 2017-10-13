const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");


class FileUploads extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/files/upload",
                type: "post",
                handler: handleFileUpload
            },
            {
                path: "/api/imgur/upload",
                type: "get",
                handler: handleImgurCache
            }
        ];
    }
}

function handleFileUpload(req, res, next) {
    if (req.files) {
        var data = req.files.filedata;
        var path = data.path;
        var newpath = this.config.logpathhidden + "uploads/" + data.name;
	console.log("Current Path:" + path);
	console.log("New Path:" + newpath);
        fs.rename(path, newpath, (err) => {
            if (err) {
                this.log.error("Error moving file from " + path + " to " + newpath);
            } else {
                this.log.verbose("Moved file from " + path + " to " + newpath);
            }
        });

        this.log.info("Got file: " + data.name);
        this.log.verbose("Hash: " + data.hash);
        res.send(200, {url: "https://repkam09.com/dl/uploads/" + data.name});
    } else {
        res.send(200, { filename: false });
    }

    next();
}

function handleImgurCache(req, res, next) {
    // Download and cache the image for future loads
    if (req.params.url) {
        var url = "http://i.imgur.com/" + req.params.url + ".jpg";
        urlcache(url, "imgur", config.logpathhidden).then((path) => {
            fs.createReadStream(path).pipe(res);
        }).catch((error) => {
            res.send(500, error);
        });
    }
}

module.exports = FileUploads;
