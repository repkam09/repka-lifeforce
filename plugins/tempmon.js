// This is a replacement for the raspi-temp-monitor project
const log = require("../utils/logger");

const prefix = 'repserv';
const threshold = 45;
const timertime = 2700000;
const errormode = false;

// Stores the timer
var timerfunc = null;

function addHandlers(server) {
    server.get("/api/tempmon/:temp", (req, res, next) => {
        log.info("Got a temp checkin from raspberry pi");

        // Clear the current timer because we got a check in time
        clearTimeout(timerfunc);

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
            handleColdTemp(response.temp);
        }

        // Write the results to a text file
        var fileString = response.date + " | " + response.temp;
        logfileout(fileString, "templogfile.txt");

        // Send the response to the client
        res.send(response);

        // restart the timer to wait until the next checkin
        log("Starting timer to wait for client checkin...");
        timerfunc = setTimeout(function () {
            serverTempTimeout();
        }, timertime);

        return next();
    });
}


// Helper function to write to a file
function logfileout(message, filename) {
    console.log("logfileout: " + filename + ":" + message);
    fs.appendFile('/home/mark/website/tools/raspi-temp-monitor/' + filename, message + '\r\n', function (err) {
        if (err) {
            console.log(err);
        }
    });
}


//var emailstring = settings.emailstring;
//console.log("Send alerts to: " + emailstring);

function serverTempTimeout() {
    console.log("Error: client timeout passed");
    errormode = true;
    var currentTime = new Date();

    var powerInternetMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: emailstring, // list of receivers
        subject: 'Possible Power or Internet Failure - pitempmon - ' + currentTime, // Subject line
        text: 'Hello! \nThis is an alert that the tempreature monitoring system has missed a status report.\nThis might mean that the system cannot access the internet or has powered off unexpectedly'
    };

    sendMailMessage(powerInternetMail);
}

function handleColdTemp(temp) {
    console.log("Error: Cold Temp - " + temp);
    errormode = true;
    var currentTime = new Date();

    var coldMail = {
        from: 'Temp Monitor <raspitempmon@gmail.com>', // sender address
        to: emailstring, // list of receivers
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
        to: emailstring,
        subject: "Temp Monitor Okay - pitempmon - " + currentTime,
        text: "Hello! \nThis is a notification that the house temp monitor service is back up and running after an error. There is nothing you need to do at this time."
    };

    sendMailMessage(resolvedMail);
}

function sendMailMessage(options) {
    transporter.sendMail(options, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
}


/**
 * This set of properties defines this as a plugin
 * You must have an enabled, name, and start property defined
 */
module.exports = {
    enabled: false,
    name: "temp monitor",
    start: (server) => {
        addHandlers(server);
    }
}