const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const nodemailer = require("nodemailer");

const threshold = 45;
const timertime = 2000000;

let settings = null;
let log = null;
let transport = null;

let tempCheckinLists = {};
let tempCheckinTimers = {};


class RaspiTempMonitor extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/temp/checkin",
                type: "post",
                handler: handleTempCheckinNew
            },
            {
                path: "/api/temp/history/:clientid",
                type: "get",
                handler: handleGetTempHistory
            },
            {
                path: "/api/temp/remove/:clientid",
                type: "get",
                handler: handleRemoveClient
            },
            {
                path: "/api/temp/clients",
                type: "get",
                handler: handleGetClients
            }
        ];

        log = logger;

        // Grab the subset of settings we actually want
        settings = this.config.tempmonitor;
        this.timerfunc = null;

        transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: settings.account.username,
                pass: settings.account.password,
            },
        });


    }
}

function handleGetClients(req, res, next) {
    const clients = Object.keys(tempCheckinLists);
    res.send(clients);
}

function handleGetTempHistory(req, res, next) {
    if (req.params && req.params.clientid) {
        this.log.info("Requesting history for clientid: " + req.params.clientid);
        getDataFromMongo(req.params.clientid).then((result) => {
            res.send(200, result);
            return next();
        });
    } else {
        res.send(400, "Bad Request");
        return next();
    }
}

function handleRemoveClient(req, res, next) {
    if (req.params && req.params.clientid) {
        const clientId = req.params.clientid;
        this.log.info("Requesting removal for clientId: " + clientId);

        try {

            if (tempCheckinLists[clientId]) {
                // Remove the last entry
                delete tempCheckinLists[clientId];
            } else {
                this.log.info("Requested client " + clientId + " does not exist");
                res.send(400, "Bad Request");
                return next();
            }

            if (tempCheckinTimers[clientId]) {
                clearTimeout(tempCheckinTimers[clientId]);
                delete tempCheckinTimers[clientId];
            }

            this.log.info("Removed entries for client: " + clientId);
            res.send(200, { error: false, data: "Removed tracking for " + clientId });
            return next();

        } catch (err) {
            res.send(500, { error: true, details: err.message });
            return next();
        }

    } else {
        res.send(400, "Bad Request");
        return next();
    }
}

function handleTempCheckinNew(req, res, next) {
    if (req.body) {
        let body = req.body;
        let clientid = null;
        let temp = null;

        if (req.body.clientid && req.body.temp) {

            clientid = req.body.clientid;
            temp = req.body.temp;

            this.log.info("Got a client checkin from " + clientid + " with temp " + temp);
            // If we get a checkin, clear the current timer
            clearTimeout(tempCheckinTimers[clientid]);

            let currentSystem = { temp: -1, error: false };
            let hasError = false;

            // See if we have seen this sytem before
            if (tempCheckinLists[clientid]) {
                currentSystem = tempCheckinLists[clientid];
            }

            // Check if we're in an error state
            if (temp < threshold) {
                hasError = true;
            } else {
                // Temp is fine! Log saying so.
                log.info("Normal checkin for " + clientid + " everything seems to be fine.");
            }

            // Check which emails if any should be triggered
            if (hasError) {
                // Temp has dropped below threshold! Sent alert email!
                try {
                    handleColdTemp(temp, clientid);
                } catch (err) {
                    log.info("Unable to handleColdTeam function", err.message);
                }
            }

            // Check which emails if any should be triggered
            if (currentSystem.error && !hasError) {
                // System had an error, but is now okay
                tempCheckinLists[clientid].error = false;
                //errorResolved(clientid); - ignore this email for now
            }

            // Update the information for the next checkin
            tempCheckinLists[clientid] = { temp: temp, error: hasError };

            try {
                // Update the mongodb database with this information
                log.info("Starting database update. [" + clientid + "," + temp + "]");
                writeTempToMongo(clientid, temp, threshold).then((resu) => {
                    log.info("Finished database update for checkin. [" + clientid + "," + temp + "]");
                }).catch((err) => {
                    log.info("Unable to update database for checkin! [" + clientid + "," + temp + "]");
                });
            } catch (err) {
                log.info("Unable to update database for checkin! Threw [" + clientid + "," + temp + "]", err.message);
            }

            // Start the timer for the next checkin test
            tempCheckinTimers[clientid] = setTimeout(serverTempTimeoutNew.bind(this), timertime, clientid);

            // Respond to the client that we've processed the checkin
            log.info("Finished processing checkin. [" + clientid + "," + temp + "]");
            res.send(200, { checkin: "OK!", clientid: clientid, temp: temp, hasError: hasError });
        } else {
            log.warn("Temp checkin attempted, missing clientid or temp field, bad request!");
            res.send(400, "Bad Request");
        }
    } else {
        log.warn("Temp checkin attempted, missing body, bad request!");
        res.send(400, "Bad Request");
    }
    return next();
}

function writeTempToMongo(clientid, temp, threshold) {
    const mongoClient = require("mongodb").MongoClient;
    const mongoConnect = "mongodb://localhost:27017/";

    log.info("Starting writeTempToMongo for " + clientid);

    return new Promise((resolve, reject) => {
        try {
            mongoClient.connect(mongoConnect, { useNewUrlParser: true }, (err, db) => {
                if (err) {
                    return reject(err);
                }

                let dbo = db.db("tempmon");
                let payload = { clientid, temp, threshold, checkinTime: new Date() };

                dbo.collection("temphistory").insertOne(payload, (err, res) => {
                    if (err) {
                        return reject(err);
                    }

                    db.close();
                    return resolve(res);
                });
            });
        } catch (err) {
            return reject(err);
        }
    });
}

function getDataFromMongo(clientid) {
    const mongoClient = require("mongodb").MongoClient;
    const mongoConnect = "mongodb://localhost:27017/";
    const resultlimit = 48;

    log.info("Starting mongo connect, looking for " + resultlimit + " results");
    return new Promise((resolve, reject) => {
        mongoClient.connect(mongoConnect, { useNewUrlParser: true }, (err, client) => {
            if (err) {
                log.info("Mongo: Unable to connect to mongodb instance, returning empty array");
                resolve([]);
            } else {
                log.info("Mongo: Connected to mongodb instance");
                try {
                    const db = client.db("tempmon");
                    db.collection("temphistory").find({ clientid: clientid }).sort({ $natural: -1 }).limit(resultlimit).toArray((err, result) => {
                        log.info("Mongo: Returning results to client");
                        resolve(result);
                    });
                } catch (err) {
                    log.info("Error! " + err.message);
                    resolve([]);
                }
            }
        });
    });
}


function serverTempTimeoutNew(clientid) {
    log.info("[" + clientid + "] Error: Timeout Alert");
    var currentTime = new Date();

    var powerInternetMail = {
        from: "Mark Repka <repkam09@gmail.com>", // sender address
        to: settings.emailstring, // list of receivers
        subject: "Possible Power or Internet Failure - pitempmon - " + currentTime, // Subject line
        text: `Tempreature Monitor Alert! 

        Name: ${clientid}
        Time: ${currentTime}

        This is an alert that the client ${clientid} missed a scheduled checkin. This might mean that the system cannot access the internet or has powered off unexpectedly!
        Please try and verify this. 
        
        This is an automated message
        `
    };

    sendMailMessage(powerInternetMail);
}

function handleColdTemp(temp, clientid) {
    log.info("[" + clientid + "] Error: Cold Temp Alert - " + temp);
    var currentTime = new Date();

    var emailoptions = {
        from: "Mark Repka <repkam09@gmail.com>", // sender address
        to: settings.emailstring, // list of receivers
        subject: `Cold Temp Alert - ${clientid} - ${currentTime}`,
        text: `Tempreature Monitor Alert! 

        Name: ${clientid}
        Temp: ${temp}
        Time: ${currentTime}

        This is an alert that the checkin for ${clientid} was ${temp}. This is below the warning threshold of ${threshold}! 
        Please try and verify that this reading is correct!
        
        This is an automated message
        `
    };

    sendMailMessage(emailoptions);
}

function sendMailMessage(options) {
    log.info("Sending email message to " + settings.emailstring + " with " + JSON.stringify(options));
    try {
        transport.sendMail(options).then((info) => {
            log.info("Mail Response: " + JSON.stringify(info));
        });
    } catch (err) {
        log.info("Mail Response Error: " + JSON.stringify(err.message));
    }
}

module.exports = RaspiTempMonitor;
