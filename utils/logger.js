module.exports = {
    level: 1,
    info: (message) => {
        console.log("[I] " + message);
    },

    debug: (message) => {
        console.log("[D] " + message);
    },

    error: (message) => {
        console.error("[ERR] " + message);
    }
}