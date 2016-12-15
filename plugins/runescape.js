const log = require("../utils/logger");
const request = require("request");
const fs = require("fs");
const urlcache = require("../utils/urlcache");
const config = require("../config.json");


const skilllist = ["overall", "attack", "defence", "strength", "constitution", "ranged", "prayer", "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking", "crafting", "smithing", "mining", "herblore", "agility", "thieving", "slayer", "farming", "runecrafting", "hunter", "construction", "summoning", "dungeoneering", "divination", "invention"];

function addHandlers(server) {
    server.get("/api/runescape/rs3/current/:username", (req, res, next) => {
        if (req.params.username) {
            let url = "http://hiscore.runescape.com/index_lite.ws?player=" + req.params.username;
            request.get(url).pipe(res);
        } else {
            res.send(400);
        }
    });

    server.get("/api/runescape/rs3/current/:username/json", (req, res, next) => {
        if (req.params.username) {
            let url = "http://hiscore.runescape.com/index_lite.ws?player=" + req.params.username;
            request.get(url, (error, response, body) => {
                if (!error) {
                    // Split on the lines
                    let response = {
                        player: {
                            name: req.params.username, avatar: "/api/runescape/avatar/" + req.params.username + "/head"
                        },
                        skills: {}
                    };
                    var lines = body.split("\n");
                    lines.forEach((line, index) => {
                        var parts = line.split(",");
                        if (parts.length === 3) {
                            response.skills[skilllist[index]] = { rank: parts[0], level: parts[1], exp: parts[2] };
                        }
                    });

                    res.send(200, response);
                } else {
                    res.send(500);
                }
            });
        } else {
            res.send(400);
        }
    });

    server.get("/api/runescape/avatar/:username/head", (req, res, next) => {
        // Download and cache the image for future loads
        if (req.params.username) {
            var url = "http://services.runescape.com/m=avatar-rs/" + req.params.username + "/chat.png"
            urlcache(url, "rs", config.logpathhidden).then((path) => {
                fs.createReadStream(path).pipe(res);
            });
        }
    });


    server.get("/api/runescape/osrs/current/:username", (req, res, next) => {
        if (req.params.username) {
            let url = "http://services.runescape.com/m=hiscore_oldschool/index_lite.ws?player=" + req.params.username;
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
    name: "runescape",
    start: (server) => {
        addHandlers(server);
    }
}