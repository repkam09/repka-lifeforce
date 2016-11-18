const debugmode = false;

module.exports = {
    level: 1,
    info: (message) => {
        console.log("[I] " + message);
    },

    debug: (message) => {
        if (debugmode) {
            console.log("[D] " + message);
        }
    },

    error: (message) => {
        console.error("[ERR] " + message);
    },

    verbose: (message) => {
        if (debugmode) {
            console.error("[V] " + message);
        }
    }
}