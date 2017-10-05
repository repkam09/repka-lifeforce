const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require('fs');

class YouTubeDownload extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/example/example",
                type: "get",
                handler: handleExampleFunction
            }
        ];

        this.youtubedl = require('youtube-dl');
    }
}

function handleExampleFunction(req, res, next) {
    if (req.body) {
        var video = this.youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA',
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

        video.pipe(fs.createWriteStream(info.filename));
    } else {
        res.send(400, { error: "bad request" });
    }
    next();
}

module.exports = YouTubeDownload;
