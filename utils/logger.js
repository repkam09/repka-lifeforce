const config = require('../config.json');
const fs = require('fs');

module.exports = {
    level: 1,
    info: (message, prefix = "") => {
        printer("[I] " + prefix + ": " + message);
    },

    debug: (message, prefix = "") => {
        printer("[D] " + prefix + ": " + message);
    },

    error: (message, prefix = "") => {
        printererror("[ERR] " + prefix + ": " + message);
    },

    verbose: (message, prefix = "") => {
        printer("[V] " + prefix + ": " + message);
    }
}

function printer(message) {
    console.log(message);
}

function printererror(message) {
    console.error(message);
}