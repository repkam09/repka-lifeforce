const config = require('../config.json');
const fs = require('fs');

let callbacks = [];

let MyLogger = {
    level: 1,
    info: (message, prefix = "") => {
        printer("[I] " + prefix + ": " + message);
    },

    debug: (message, prefix = "") => {
        printer("[D] " + prefix + ": " + message);
    },

    warn: (message, prefix = "") => {
        printer("[W] " + prefix + ": " + message);
    },

    error: (message, prefix = "") => {
        printererror("[ERR] " + prefix + ": " + message);
        printerspecial("[ERR] " + prefix + ": " + message);
    },

    verbose: (message, prefix = "") => {
        printer("[V] " + prefix + ": " + message);
    },

    special: (message, prefix = "") => {
        printerspecial("[S] " + prefix + ": " + message);
    },

    registerCallback: (newFunction) => {
        callbacks.push(newFunction);
    }
}

module.exports = MyLogger;

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