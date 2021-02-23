const log = require("./logger2.js")("SecureMiddleware")
const config = require("../config.json");

function hasSecureHeader(req, res) {
    if (req.headers['repka-verify']) {
        log.info("hasSecureHeader has passed");
        return true;
    } else {
        log.info("hasSecureHeader has failed - returning 401 unauth");
        res.send(401, "Secure Verificiation Failed");
        return false;
    }
}

module.exports = hasSecureHeader;