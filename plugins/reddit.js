const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const request = require("request");

class RedditEndpoints extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/reddit/posts/:subreddit",
                type: "get",
                handler: handleSubredditPosts
            },
            {
                path: "/api/reddit/comments/:subreddit/:article",
                type: "get",
                handler: handlePostComments
            }
        ];
    }
}

function handleSubredditPosts(req, res, next) {
    if (req.params.subreddit) {
        var url = "https://www.reddit.com/r/" + req.params.subreddit + "/.json";
        request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

function handlePostComments(req, res, next) {
    if (req.params.subreddit && req.params.article) {
        var url = "https://www.reddit.com/r/" + req.params.subreddit + "/comments/" + req.params.article + "/.json";
        request.get(url).pipe(res);
    } else {
        res.send(400);
    }
}

module.exports = RedditEndpoints;
