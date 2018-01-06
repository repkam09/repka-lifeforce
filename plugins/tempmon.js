const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require('fs');

let errormode = false;
const threshold = 45;
const timertime = 2700000;
let settings = null;
let transporter = null;
let log = null;

let tempCheckinLists = {};
let tempCheckinTimers = {};

class RaspiTempMonitor extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/api/tempmon/:temp",
                type: "get",
                handler: handleTempCheckin
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

        // create reusable transporter object using SMTP transport
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
    this.log.info("Got a temp checkin from raspberry pi");

    // Clear the current timer because we got a check in time
    clearTimeout(this.timerfunc);

    // If we get this call, but we're in errormode, the system got a message
    // after a previous failure.
    if (errormode) {
        errorResolved();
    }

    var response = {};
    response.date = Date.now();
    response.temp = req.params.temp;

    // Check if the temp is under our threshold and warn us!
    if (response.temp < threshold) {
        this.log.info("This is a cold temp! Handle this error!");
        handleColdTemp(response.temp);
    } else {
        this.log.info("Normal checkin, nothing is wrong.");
    }

    // Write the results to a text file
    var fileString = response.date + " | " + response.temp;
    logfileout(fileString, "templogfile.txt");

    // Send the response to the client
    res.send(200, response);

    // restart the timer to wait until the next checkin
    this.log.info("Starting timer to wait for client checkin...");
    this.timerfunc = setTimeout(function () {
        serverTempTimeout();
    }, timertime);

    return next();
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
            clearTimeout(tempCheckinTimers[clientid]);

            tempCheckinLists[clientid] = temp;
            tempCheckinTimers[clientid] = setTimeout(serverTempTimeoutNew, timertime / 100, clientid);

            res.send(200, { checkin: "OK!", clientid: clientid, temp: temp });
        } else {
            res.send(400, "Bad Request");

        }
    } else {
        res.send(400, "Bad Request");

    }


    return next();
}

// Helper function to write to a file
function logfileout(message, filename) {
    log.info("logfileout: " + filename + ":" + message);
    try {
        fs.appendFile('/home/mark/website/tools/raspi-temp-monitor/' + filename, message + '\r\n', function (err) {
            if (err) {
                log.info("Warning! Unable to write to log file!");
                console.log(err);
            }
        });
    } catch (error) {
        console.error("Unable to write to output file... " + error.message);
        debugger;
    }
}

function serverTempTimeout() {
    this.log.info("Error: client timeout passed");
    errormode = true;
    var currentTime = new Date();

    var powerInternetMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: settings.emailstring, // list of receivers
        subject: 'Possible Power or Internet Failure - pitempmon - ' + currentTime, // Subject line
        text: 'Hello! \nThis is an alert that the tempreature monitoring system has missed a status report.\nThis might mean that the system cannot access the internet or has powered off unexpectedly'
    };

    sendMailMessage(powerInternetMail);
}


function serverTempTimeoutNew(clientid) {
    this.log.info("Error: client " + clientid + " timeout passed");
    debugger;
    let singleClientError = true;
    var currentTime = new Date();

    var powerInternetMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: settings.emailstring, // list of receivers
        subject: 'Possible Power or Internet Failure - pitempmon - ' + currentTime, // Subject line
        text: 'Hello! \nThis is an alert that the tempreature monitoring system has missed a status report.\nThis might mean that the system cannot access the internet or has powered off unexpectedly'
    };

    debugger;
    //sendMailMessage(powerInternetMail);
}



function handleColdTemp(temp) {
    log.info("Error: Cold Temp - " + temp);
    errormode = true;
    var currentTime = new Date();

    var coldMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: settings.emailstring, // list of receivers
        subject: 'Cold Temp Alert - pitempmon - ' + currentTime, // Subject line
        text: 'Hello! \nThis is an alert that the current temp recorded by the tempreature monitoring system was ' + temp + '.\nThis is below the accepted threshold of ' + threshold + '\n\nPlease verify that this reading is correct!'
    };

    sendMailMessage(coldMail);
}


function errorResolved() {
    console.log("Error Resolved - Client Checkin");
    errormode = false;
    var currentTime = new Date();

    var resolvedMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>',
        to: settings.emailstring,
        subject: "Temp Monitor Okay - pitempmon - " + currentTime,
        text: "Hello! \nThis is a notification that the house temp monitor service is back up and running after an error. There is nothing you need to do at this time."
    };

    sendMailMessage(resolvedMail);
}

function sendMailMessage(options) {

    log.info("Sending email message to " + settings.emailstring + " with " + JSON.stringify(options));

    transporter.sendMail(options, function (error, info) {
        if (error) {
            log.info("Unable to send email:" + JSON.stringify(error));
        } else {
            log.info('Message sent: ' + info.response);
        }
    });
}

module.exports = RaspiTempMonitor;