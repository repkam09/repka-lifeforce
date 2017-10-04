const log = require("../utils/logger");
const request = require("request");


function addHandlers(server) {
    server.get("/api/reddit/posts/:subreddit", (req, res, next) => {
        if (req.params.subreddit) {
            var url = "https://www.reddit.com/r/" + req.params.subreddit + "/.json";
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

    server.get("/api/reddit/posts/:subreddit/top", (req, res, next) => {
        if (req.params.subreddit) {
            var url = "https://www.reddit.com/r/" + req.params.subreddit + "/top/.json";
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

    server.get("/api/reddit/comments/:subreddit/:article", (req, res, next) => {
        if (req.params.subreddit && req.params.article) {
            var url = "https://www.reddit.com/r/" + req.params.subreddit + "/comments/" + req.params.article + "/.json";
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

}

/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: true,
    name: "reddit",
    start: (server) => {
        addHandlers(server);
    }
}