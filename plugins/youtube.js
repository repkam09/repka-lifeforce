const fs = require('fs');
const youtubedl = require('youtube-dl');
const log = require("../utils/logger");
const config = require("../config.json");


function addHandlers(server) {
    server.post("/api/youtube/download", (req, res, next) => {
        if (req.body) {
            var video = youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA',
                // Optional arguments passed to youtube-dl.
                ['--format=18'],
                // Additional options can be given for calling `child_process.execFile()`.
                { cwd: __dirname });

            // Will be called when the download starts.
            video.on('info', function (info) {
                console.log('Download started');
                console.log('filename: ' + info.filename);
                console.log('size: ' + info.size);
            });

            video.pipe(fs.createWriteStream('myvideo.mp4'));
        } else {
            res.send(400, { error: "bad request" });
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
    name: "youtube",
    start: (server) => {
        addHandlers(server);
    }
}
