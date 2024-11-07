/**
 * Set up imports that are required at this level for the application
 */
const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const fs = require("fs");
const os = require("os");
const path = require("path");
const geoip = require("geoip-country");

/**
 * Set up imports from local files
 */
const logMiddleware = require("./utils/logger2.js");
const cache = require("./utils/cache");
const logName = "Lifeforce";
const log = logMiddleware(logName);

// Set the app name and some other helpful variables
const tempdir = os.tmpdir();
const pluginpath = "./plugins/";

// This variable will contain settings and api keys that are not public
log.info("Loading settings from config.json...");
const settings = require("./config.json");

log.info("loading enabled list from enabled.json");
const enabledPlugins = require("./enabled.json");

if (settings.redis) {
  log.info("redis cache enabled");
  cache.cacheInit();
} else {
  log.info("redis cache disabled");
}

log.info("Creating Restify Server...");
const server = restify.createServer({
  name: "api.repkam09.com",
  version: "1.1.0",
  maxParamLength: 2048,
  handleUpgrades: true
});

server.websocket = {
  handlers: []
};

const cors = corsMiddleware({
  origins: [
    "https://repkam09.com",
    "http://localhost:8080",
    "http://localhost:8000",
    "http://localhost",
    "http://localhost:3000",
  ],
  allowHeaders: ["cache-control", "repka-repcast-token", "repka-verify"],
});

server.pre(cors.preflight);
server.use(cors.actual);
server.pre(restify.plugins.pre.context());
server.use(restify.plugins.authorizationParser());
server.use(
  restify.plugins.bodyParser({
    mapParams: true,
    mapFiles: true,
    overrideParams: true,
    keepExtensions: true,
    uploadDir: tempdir,
    multiples: true,
    hash: "md5",
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

  let endpoint = req.url;
  if (endpoint.length > 500) {
    endpoint = req.url.substr(0, 500) + "...";
  }

  let limit = ratelimit(clientip);

  if (limit) {
    res.send(429, "rate limited");
  }

  const user = {
    method: req.method,
    ip: clientip,
    country: iplookup(clientip),
    endpoint: endpoint,
  };

  if (limit) {
    log.debug("Ratelimited - returning 429 Too Many Requests");
    return next(false);
  }

  log.debug(">>> " + JSON.stringify(user) + " <<<");

  let block = blacklist(user);
  if (block) {
    res.send(401, "bl");
    return next(false);
  }

  return next();
});

function ratelimit(ip) {
  let limit = [];

  if (limit.indexOf(ip) !== -1) {
    return true;
  }

  return false;
}

function blacklist(user) {
  let blacklist = ["RU"];
  if (blacklist.indexOf(user.country) !== -1) {
    return true;
  }

  return false;
}

const endpoints = [];
server.updateAbout = (entry) => {
  endpoints.push(entry);
};

server.getAbout = () => {
  return endpoints;
};

// Go out and check the plugins list for endpoints to listen on
const pluginList = [];
fs.readdir(pluginpath, (err, files) => {
  files.forEach((file) => {
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
              let temp = new plugin(server, logMiddleware(plugin.name), plugin.name);

              // Attach the handlers to restify
              temp.addHandlers(plugin.name);

              // Attach socket handlers
              const socketHandler = temp.addSocketHandler(plugin.name);
              server.websocket.handlers.push(socketHandler);

              // Add this plugin to the list of plugins
              pluginList.push(temp);
            } else {
              log.debug(
                "Skipping " + plugin.name + " plugin because it is disabled"
              );
            }
          }
        }
      }
    });
  });
});

// Startup the server
log.info("Starting Restify Server...");
server.listen(16001, () => {
  log.info(server.name + " listening at " + server.url);
});

function iplookup(ipaddr) {
  try {

    if (ipaddr.startsWith("10.0.4.")) {
      return "RepFi Local";
    }

    if (ipaddr.startsWith("::ffff:10.0.4")) {
      return "RepFi Local";
    }

    const geo = geoip.lookup(ipaddr);
    return geo.country;
  } catch (err) {
    return "unknown";
  }
}
