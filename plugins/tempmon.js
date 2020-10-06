const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

const threshold = 45;
const timertime = 2000000;

let settings = null;
let log = null;

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
                path: "/api/temp/clients",
                type: "get",
                handler: handleGetClients
            }
        ];

        log = logger;

        // Grab the subset of settings we actually want
        settings = this.config.tempmonitor;
        this.timerfunc = null;
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
                handleColdTemp(temp, clientid);
            }

            // Check which emails if any should be triggered
            if (currentSystem.error && !hasError) {
                // System had an error, but is now okay
                tempCheckinLists[clientid].error = false;
                //errorResolved(clientid); - ignore this email for now
            }

            // Update the information for the next checkin
            tempCheckinLists[clientid] = { temp: temp, error: hasError };

            // Update the mongodb database with this information
            writeTempToMongo(clientid, temp, threshold).then((resu) => {
                log.info("Finished database update for checkin. [" + clientid + "," + temp + "]");
            }).catch((err) => {
                log.info("Unable to update database for checkin! [" + clientid + "," + temp + "]");
            });

            // Start the timer for the next checkin test
            tempCheckinTimers[clientid] = setTimeout(serverTempTimeoutNew.bind(this), timertime, clientid);

            // Respond to the client that we've processed the checkin
            log.info("Finished processing checkin. [" + clientid + "," + temp + "]");
            res.send(200, { checkin: "OK!", clientid: clientid, temp: temp, hasError: hasError });
        } else {
            log.warn("Temp checkin attempted, missing clientid or temp field, bad request!")
            res.send(400, "Bad Request");
        }
    } else {
        log.warn("Temp checkin attempted, missing body, bad request!")
        res.send(400, "Bad Request");
    }
    return next();
}

function writeTempToMongo(clientid, temp, threshold) {
    const mongoClient = require("mongodb").MongoClient;
    const mongoConnect = "mongodb://localhost:27017/";

    log.info("Starting writeTempToMongo for " + clientid);

    return new Promise((resolve, reject) => {
        mongoClient.connect(mongoConnect, { useNewUrlParser: true }, (err, db) => {
            if (err) {
                reject(err);
            }

            let dbo = db.db("tempmon");
            let payload = { clientid, temp, threshold, checkinTime: new Date() };

            dbo.collection("temphistory").insertOne(payload, (err, res) => {
                if (err) {
                    reject(err);
                }

                db.close();
                resolve(res);
            });
        });
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
                    db.collection('temphistory').find({ clientid: clientid }).sort({ $natural: -1 }).limit(resultlimit).toArray((err, result) => {
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
    this.log.info("Error: client " + clientid + " timeout passed");
    var currentTime = new Date();

    var powerInternetMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: settings.emailstringrepka, // list of receivers
        subject: 'Possible Power or Internet Failure - pitempmon - ' + currentTime, // Subject line
        text: 'Hello! \nThis is an alert that the tempreature monitoring system for ' + clientid + ' has missed a status report.\nThis might mean that the system cannot access the internet or has powered off unexpectedly'
    };

    sendMailMessage(powerInternetMail);
}

function handleColdTemp(temp, clientid) {
    log.info("[" + clientid + "] Error: Cold Temp Alert - " + temp);
    var currentTime = new Date();

    var emailoptions = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: settings.emailstringrepka, // list of receivers
        subject: `Cold Temp Alert - ${clientid} - ${currentTime}`,
        text: `Alert! 

        Name: ${clientid}
        Temp: ${temp}
        Time: ${currentTime}

        This is an alert that the checkin for ${clientid} was ${temp}. This is below the warning threshold of ${threshold}! 
        Please try and verify that this reading is correct!`
    };

    sendMailMessage(emailoptions);
}

function sendMailMessage(options) {
    // Actually just send this to Telegram for now. Dont bother with email.
    log.info("@repkam09: Sending email message to " + settings.emailstring + " with " + JSON.stringify(options));
}

module.exports = RaspiTempMonitor;
