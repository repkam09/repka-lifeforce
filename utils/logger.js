const config = require('../config.json');
const fs = require('fs');

const debugmode = true;
const writetofile = true;

module.exports = {
    level: 1,
    info: (message) => {
        printer("[I] " + message);
    },

    debug: (message) => {
        if (debugmode) {
            printer("[D] " + message);
        }
    },

    error: (message) => {
        printererror("[ERR] " + message);
    },

    verbose: (message) => {
        if (debugmode) {
            printer("[V] " + message);
        }
    }
}

function printer(message) {
    console.log(message);
    logToFile(message);
}

function printererror(message) {
    console.error(message);
    logToFile(message);
}

function logToFile(message) {
    if (writetofile) {
        var path = config.logpathhidden + "lifeforcelog.txt";
        // Append the log message to the file
        fs.appendFile(path, message + "\n", function (err) {
            if (err) {
                console.log("Error writing to file " + path + JSON.stringify(err));
            }
        });
    }
}