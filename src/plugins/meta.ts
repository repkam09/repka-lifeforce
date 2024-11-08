import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import geoip from "geoip-country";
import { getClientIP } from "../utils/common";

export class MetaEndpoints extends LifeforcePlugin {
  constructor(router: KoaRouter) {
    super(router);

    this.addHandlers([
      {
        path: "/api/about",
        type: "GET",
        handler: this.handleAboutApi.bind(this),
        cacheTTL: 86400,
      },
      {
        path: "/",
        type: "GET",
        handler: this.handleAboutApi.bind(this),
        cacheTTL: 86400,
      },
      {
        path: "/api/gettest",
        type: "GET",
        handler: handleGetTest,
      },
      {
        path: "/api/posttest",
        type: "POST",
        handler: handlePostTest,
      },
      {
        path: "/api/getip",
        type: "GET",
        handler: handleGetIp,
      },
      {
        path: "/api/geoip",
        type: "GET",
        handler: getGeoIpCountry,
      },
    ]);
  }

  public init(): void {
    console.log("MetaEndpoints initialized");
  }

  private handleAboutApi(ctx: Context, next: Next) {
    const endpoints: string[] = [];
    this.router.stack.forEach((r) => {
      if (r.path) {
        endpoints.push(r.path);
      }
    });

    ctx.status = 200;
    ctx.body = {
      name: "Lifeforce",
      version: "2.0.0",
      endpoints: endpoints,
    };

    return next();
  }
}

function handleGetIp(ctx: Context, next: Next) {
  const ip = getClientIP(ctx.req);
  ctx.body = { ip: ip };
  return next();
}

function getGeoIpCountry(ctx: Context, next: Next) {
  const ip = getClientIP(ctx.req);
  const geo = geoip.lookup(ip);
  ctx.body = { geodata: geo };
  return next();
}

function handleGetTest(ctx: Context, next: Next) {
  ctx.body = { test: "passed" };
  return next();
}

function handlePostTest(ctx: Context, next: Next) {
  ctx.body = { test: "passed" };
  return next();
}
