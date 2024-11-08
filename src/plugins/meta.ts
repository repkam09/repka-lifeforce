import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import geoip from "geoip-country";
import { getClientIP } from "../utils/common";
import { Config } from "../utils/config";

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

  public async init(): Promise<void> {
    console.log("MetaEndpoints initialized");
  }

  private handleAboutApi(ctx: Context, next: Next) {
    const endpoints: { method: string; path: string; plugin: string }[] = [];
    this.router.stack.forEach((r) => {
      endpoints.push({
        method: r.methods[r.methods.length - 1].toUpperCase(),
        path: `${Config.LIFEFORCE_PUBLIC_URL}${r.path}`,
        plugin: r.name,
      });
    });

    ctx.status = 200;
    ctx.body = endpoints;

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
