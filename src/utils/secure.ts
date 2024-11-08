import { Context, Next } from "koa";
import { Logger } from "./logger";
import geoip from "geoip-country";
import { getClientIP } from "./common";

export function rateLimitMiddleware(ctx: Context, next: Next) {
  return next();
}

export function traceLogMiddleware(ctx: Context, next: Next) {
  const clientip = getClientIP(ctx.req);

  let endpoint = ctx.req.url as string;
  if (endpoint.length > 500) {
    endpoint = endpoint.substr(0, 500) + "...";
  }

  const session = {
    method: ctx.req.method,
    ip: clientip,
    country: lookup(clientip),
    endpoint: endpoint,
  };

  Logger.debug(">>> " + JSON.stringify(session) + " <<<");
  return next();
}

export function blacklistMiddleware(ctx: Context, next: Next) {
  const blacklist = ["RU"];

  const clientip = getClientIP(ctx.req);

  const country = lookup(clientip);
  if (blacklist.indexOf(country) !== -1) {
    ctx.status = 401;
    ctx.body = "Unauthorized";
    return next();
  }

  return next();
}

function lookup(ipaddr: string) {
  try {
    if (ipaddr.startsWith("10.0.4.")) {
      return "Local";
    }

    if (ipaddr.startsWith("::ffff:10.0.4")) {
      return "Local";
    }

    const geo = geoip.lookup(ipaddr);
    if (!geo) {
      return "unknown";
    }
    return geo.country;
  } catch (err) {
    return "unknown";
  }
}
