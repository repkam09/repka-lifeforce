const fs = require('fs');

const apiMap = [
    {
        path: "/api/example/example",
        type: "get",
        handler: handleExampleFunction
    }
];

class YouTubeDownload {
    constructor(server, logger, name) {
        this.config = require("../config.json");
        this.log = logger;
        this.server = server;
        this.name = name;
        this.youtubedl = require('youtube-dl');
    }

    addHandlers() {
        for (var i = 0; i < apiMap.length; i++) {
            var item = apiMap[i];
            this.log.info("Starting up handler for " + item.type + " request on " + item.path + "", this.name);
            this.server[item.type](item.path, item.handler);
        }
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
