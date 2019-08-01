const request = require('request');
const fs = require('fs');
const log = require("./logger");

module.exports = function (url, tag, basepath, res) {
    var encodedName = new Buffer.from(url).toString('base64');
    var path = basepath + "uploads/" + tag + "_" + encodedName;

    return new Promise((resolve, reject) => {
        try {
            // If the file already exists, resolve the path instantly
            fs.accessSync(path);
            resolve(path);
        } catch (e) {
            // If we hit this case, the file has not been downloaded yet. Download it and then give the path back.
            request.get(url).pipe(fs.createWriteStream(path)).on('close', () => {
                resolve(path);
            });
        }
    });
}


