const config = require("../config.json");

let callbacks = [];

module.exports = function CreateLoggerMiddleware(prefix = "") {
    return {
        level: 1,
        info: (message) => {
            printer("[I] " + prefix + ": " + message);
        },

        debug: (message,) => {
            printer("[D] " + prefix + ": " + message);
        },

        warn: (message,) => {
            printer("[W] " + prefix + ": " + message);
        },

        error: (message,) => {
            printererror("[ERR] " + prefix + ": " + message);
            printerspecial("[ERR] " + prefix + ": " + message);
        },

        verbose: (message,) => {
            printer("[V] " + prefix + ": " + message);
        },

        special: (message,) => {
            printerspecial("[S] " + prefix + ": " + message);
        },

        registerCallback: (newFunction) => {
            callbacks.push(newFunction);
        }
    };
};

function printer(message) {
    console.log(message);

    callbacks.forEach((callback) => {
        callback(message);
    });
}

function printererror(message) {
    console.error(message);
}

function printerspecial(message) {
    console.log(message);

    callbacks.forEach((callback) => {
        callback(message);
    });
}