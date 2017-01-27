/**
 * Set up imports that are required at this level for the application
 */
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const fs = require("fs");
const os = require('os');
const path = require('path')

/**
 * Set up imports from local files
 */
const log = require("./utils/logger.js");

// Set the app name and some other helpful variables
const tempdir = os.tmpdir();
const pluginpath = "./plugins/";

// This variable will contain settings and api keys that are not public
log.info("Loading settings from config.json...");
const settings = require("./config.json");

log.info("Creating Restify Server...");
const server = restify.createServer({
    name: 'api.repkam09.com',
    version: '1.1.0'
});

const cors = corsMiddleware({
    origins: ['https://repkam09.com'],
    allowHeaders: ['cache-control']
});

server.use(restify.fullResponse());
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.authorizationParser());
server.use(restify.bodyParser({
    mapParams: true,
    mapFiles: true,
    overrideParams: false,
    keepExtensions: true,
    uploadDir: tempdir,
    multiples: true,
    hash: 'md5'
}));


/**
 * Quick function to log incoming requests
 */
server.use(function logging(req, res, next) {
    var clientip = "unknown";
    if (req.headers['x-forwarded-for']) {
        clientip = req.headers['x-forwarded-for'];
    } else if (req.connection.remoteAddress) {
        clientip = req.connection.remoteAddress;
    }

    var user = { method: req.method, endpoint: req.url, ip: clientip };
    log.info(">>> " + JSON.stringify(user) + " <<<");
    return next();
});


// Go out and check the plugins list for endpoints to listen on
fs.readdir(pluginpath, (err, files) => {
    files.forEach(file => {
        fs.stat(pluginpath + "/" + file, (err, stats) => {
            if (!stats.isDirectory()) {
                let type = path.extname(file);
                if (type === ".js") {
                    // Load the plugin and check if it is enabled
                    const plugin = require(pluginpath + "/" + file);

                    // Check that this is a valid plugin. 
                    // A Plugin must have a name, an enabled value, and a 'start' function
                    if (plugin.hasOwnProperty('name') && plugin.hasOwnProperty('enabled') && plugin.hasOwnProperty('start')) {
                        if (plugin.enabled) {
                            // If this plugin is enabled, start it!
                            log.info("Starting up " + plugin.name + " plugin");

                            // Call the plugins start method to attach the various get/post/etc
                            plugin.start(server);
                        } else {
                            log.debug("Skipping " + plugin.name + " plugin because it is disabled");
                        }
                    } else {
                        // Found a potential plugin, but it is malformed or missing a property
                        log.info("Skipping file " + file + " because it is missing plugin properties");
                    }
                }
            }
        });
    });
});

// Startup the server
log.info("Starting Restify Server...");
server.listen(16001, () => {
    log.info(server.name + ' listening at ' + server.url);
});