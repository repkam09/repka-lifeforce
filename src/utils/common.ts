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

export function rateLimitMiddleware(ctx: Context, next: Next) {
  return next();
}

export function traceLogMiddleware(ctx: Context, next: Next) {
  if (ctx.req.url && ctx.req.url.indexOf("/api/health") !== -1) {
    return next();
  }

  const clientip = getClientIP(ctx.req);

  let endpoint = ctx.req.url as string;
  if (endpoint.length > 500) {
    endpoint = endpoint.substr(0, 500) + "...";
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

export function whitelistMiddleware(ctx: Context, next: Next) {
  const whitelist = ["US", "Local"];

  const clientip = getClientIP(ctx.req);
  const country = lookup(clientip);

  if (hasValidAuth(ctx)) {
    return next();
  }

  if (whitelist.indexOf(country) === -1) {
    Logger.debug(
      `clientip ${clientip} blocked from ${country} country, not whitelisted`
    );
    ctx.status = 401;
    ctx.body = "Unauthorized";
    return;
  }
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

export function hasValidAuth(ctx: Context): boolean {
  const verify = ctx.headers["repka-verify"];
  if (verify && verify === Config.LIFEFORCE_AUTH_TOKEN) {
    return true;
  }

  const auth = ctx.headers["authorization"];
  if (auth && auth === Config.LIFEFORCE_AUTH_TOKEN) {
    return true;
  }

  const query = ctx.query.token;
  if (query && query === Config.LIFEFORCE_AUTH_TOKEN) {
    return true;
  }

  return false;
}
