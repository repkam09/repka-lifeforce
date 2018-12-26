const LifeforcePlugin = require("../utils/LifeforcePlugin.js");

const threshold = 45;
const timertime = 2000000;
//const timertime = 20000;
let transporter = null;
let settings = null;
let log = null;
const sendRealEmail = true;

let tempCheckinLists = {};
let tempCheckinTimers = {};

class RaspiTempMonitor extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/tempmon/:temp",
                type: "get",
                handler: handleTempCheckin // This method has been deprecated
            },
            {
                path: "/api/temp/checkin",
                type: "post",
                handler: handleTempCheckinNew
            }
        ];

        log = logger;

        // Grab the subset of settings we actually want
        settings = this.config.tempmonitor;
        this.timerfunc = null;

        const nodemailer = require("nodemailer");
        transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: settings.emailuser,
                pass: settings.emailpass
            }
        });
    }
}

function handleTempCheckin(req, res, next) {
    // This method has been deprecated, convert it into the newer API call
    if (req.params && req.params.temp) {

        const fakereq = {
            body: {
                clientid: "legacy",
                temp: req.params.temp
            }
        }

        // Pass this to the new api handler
        this.log.info("Converting legacy temp checkin to new api format");
        handleTempCheckinNew.call(this, fakereq, res, next);
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
                errorResolved(clientid);
            }

            // Update the information for the next checkin
            tempCheckinLists[clientid] = { temp: temp, error: hasError };

            // Start the timer for the next checkin test
            tempCheckinTimers[clientid] = setTimeout(serverTempTimeoutNew.bind(this), timertime, clientid);

            // Respond to the client that we've processed the checkin
            res.send(200, { checkin: "OK!", clientid: clientid, temp: temp, hasError: hasError });
        } else {
            res.send(400, "Bad Request");
        }
    } else {
        res.send(400, "Bad Request");
    }
    return next();
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


function errorResolved(clientid) {
    log.info("[" + clientid + "] Error Resolved. Everything okay.");
    var currentTime = new Date();

    var resolvedMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>',
        to: settings.emailstring,
        subject: "Temp Monitor Okay - pitempmon - " + currentTime,
        text: "Hello! \nThis is a notification that the house temp monitor service is back up and running after an error. There is nothing you need to do at this time."
    };

    var emailoptions = {
        from: 'Temp Monitor <raspitempmon@gmail.com>',
        to: settings.emailstring,
        subject: `Temp Monitor Okay - ${clientid} - ${currentTime}`,
        text: `Alert! 

        Name: ${clientid}
        Time: ${currentTime}

        Proble ${clientid} was ${temp}. This is below the warning threshold of ${threshold}! 
        Please try and verify that this reading is correct!`
    };

    sendMailMessage(resolvedMail);
}

function sendMailMessage(options) {
    if (sendRealEmail) {
        log.info("Sending email message to " + settings.emailstring + " with " + JSON.stringify(options));
        transporter.sendMail(options, function (error, info) {
            if (error) {
                log.info("Unable to send email:" + JSON.stringify(error));
            } else {
                log.info('Message sent: ' + info.response);
            }
        });
    } else {
        log.info(JSON.stringify(options));
    }
}

module.exports = RaspiTempMonitor;
