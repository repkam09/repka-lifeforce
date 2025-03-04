import { IncomingMessage } from "http";
import { Config } from "./config";
import { Logger } from "./logger";
import { Context, Next } from "koa";
import geoip from "geoip-country";

export function getClientIP(req: IncomingMessage): string {
  let ip = "0.0.0.0";
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"] as string;
  } else if (req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  return ip;
}

export function traceLogMiddleware(ctx: Context, next: Next) {
  if (ctx.req.url && ctx.req.url.indexOf("/api/health") !== -1) {
    return next();
  }

  const clientip = getClientIP(ctx.req);

  let endpoint = ctx.req.url as string;
  if (endpoint.length > 250) {
    endpoint = endpoint.substr(0, 250) + "...";
  }

  const session = {
    date: new Date().toISOString(),
    method: ctx.req.method,
    ip: clientip,
    country: lookup(clientip),
    endpoint: endpoint,
  };

  Logger.info(">>> " + JSON.stringify(session) + " <<<");
  return next();
}

function lookup(ipaddr: string) {
  try {
    if (Config.LIFEFORCE_LOCAL_IPS.some((addr) => ipaddr.includes(addr))) {
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
