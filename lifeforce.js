/**
 * Set up imports that are required at this level for the application
 */
const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Set up imports from local files
 */
const log = require("./utils/logger.js");
const logName = "Lifeforce";

// Set the app name and some other helpful variables
const tempdir = os.tmpdir();
const pluginpath = "./plugins/";

// This variable will contain settings and api keys that are not public
log.info("Loading settings from config.json...", logName);
const settings = require("./config.json");

log.info("loading enabled list from enabled.json", logName);
const enabledPlugins = require("./enabled.json");

log.info("Creating Restify Server...", logName);
const server = restify.createServer({
  name: "api.repkam09.com",
  version: "1.1.0",
  maxParamLength: 2048
});

const cors = corsMiddleware({
  origins: [
    "https://repkam09.com",
    "http://localhost:8080",
    "http://localhost:8000",
    "http://localhost",
    "https://demo.kaspe.net",
    "http://localhost:3000"
  ],
  allowHeaders: ["cache-control", "repka-repcast-token", "repka-verify"]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.authorizationParser());
server.use(
  restify.plugins.bodyParser({
    mapParams: true,
    mapFiles: true,
    overrideParams: true,
    keepExtensions: true,
    uploadDir: tempdir,
    multiples: true,
    hash: "md5"
  })
);

/**
 * Quick function to log incoming requests
 */
server.pre(function logging(req, res, next) {
  let clientip = "unknown";
  if (req.headers["x-forwarded-for"]) {
    clientip = req.headers["x-forwarded-for"];
  } else if (req.connection.remoteAddress) {
    clientip = req.connection.remoteAddress;
  }

  const user = { method: req.method, endpoint: req.url, ip: clientip };
  log.info(">>> " + JSON.stringify(user) + " <<<", logName);
  return next();
});

const endpoints = [];
server.updateAbout = (entry) => {
  endpoints.push(entry);
}

server.getAbout = () => {
  return endpoints;
}


// Go out and check the plugins list for endpoints to listen on
const pluginList = [];
fs.readdir(pluginpath, (err, files) => {
  files.forEach(file => {
    fs.stat(pluginpath + "/" + file, (err, stats) => {
      if (!stats.isDirectory()) {
        let type = path.extname(file);
        if (type === ".js") {
          // Load the plugin and check if it is enabled
          const plugin = require(pluginpath + "/" + file);
          let status = enabledPlugins[plugin.name];
          if (!status) {
            log.debug(
              "Skipping " +
              plugin.name +
              " plugin because it does not have an entry in config",
              logName
            );
          } else {
            if (status && status.enabled) {
              // Call the plugins start method to attach the various get/post/etc
              let temp = new plugin(server, log, plugin.name);

              // Attach the handlers to restify
              temp.addHandlers();

              // Add this plugin to the list of plugins
              pluginList.push(temp);
            } else {
              log.debug(
                "Skipping " + plugin.name + " plugin because it is disabled",
                logName
              );
            }
          }
        }
      }
    });
  });
});


// Startup the server
log.info("Starting Restify Server...", logName);
server.listen(16001, () => {
  log.info(server.name + " listening at " + server.url, logName);
});
