import { Context, Next } from "koa";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import geoip from "geoip-country";
import { getClientIP } from "../utils/common";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";

export class MetaEndpoints extends LifeforcePlugin {
  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.mcp.resource("about", "lifeforce://about", async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: "The Lifeforce (or repka-lifeforce) is an Open Source collection of REST APIs created by Mark Repka.",
          },
        ],
      };
    });

    this.mcp.resource("endpoints", "lifeforce://endpoints", async (uri) => {
      const endpoints: { method: string; path: string; plugin: string }[] = [];
      this.router.stack.forEach((r) => {
        endpoints.push({
          method: r.methods[r.methods.length - 1].toUpperCase(),
          path: `${Config.LIFEFORCE_PUBLIC_URL}${r.path}`,
          plugin: r.name,
        });
      });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(endpoints),
          },
        ],
      };
    });

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
        handler: getHealthCheck,
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
      {
        path: "/api/health",
        type: "GET",
        handler: getHealthCheck,
      },
      {
        path: "/api/login",
        type: "POST",
        handler: this.handleLifeforceLogin.bind(this),
      },
      {
        path: "/api/authtest",
        type: "GET",
        handler: this.handleAuthTest.bind(this),
        auth: true,
      },
      {
        path: "/api/webhook/log",
        type: "GET",
        handler: this.handleLogGetEvent.bind(this),
        auth: false,
      },
      {
        path: "/api/webhook/log",
        type: "POST",
        handler: this.handleLogPostEvent.bind(this),
        auth: false,
      },
    ]);
  }

  public async init(): Promise<void> {
    Logger.info("MetaEndpoints initialized");
  }

  private async handleAuthTest(ctx: Context, next: Next) {
    ctx.status = 200;
    ctx.body = "Authorized";
    return next();
  }

  private handleLogGetEvent(ctx: Context, next: Next) {
    Logger.info(`Webhook Log GET: Params: ${JSON.stringify(ctx.query)}`);
    ctx.body = { event: "ok" };
    return next();
  }

  private handleLogPostEvent(ctx: Context, next: Next) {
    Logger.info(
      `Webhook Log POST: Body: ${JSON.stringify(
        ctx.request.body
      )}, Params: ${JSON.stringify(ctx.query)}`
    );
    ctx.body = { event: "ok" };
    return next();
  }

  private async handleLifeforceLogin(ctx: Context, next: Next) {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };
    if (!email || !password) {
      ctx.status = 400;
      ctx.body = { error: "Missing username or password" };
      return next();
    }

    const response = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      ctx.status = 401;
      ctx.body = { error: "Invalid Login" };
      return next();
    }

    if (!response.data.user) {
      ctx.status = 401;
      ctx.body = { error: "Invalid Login" };
      return next();
    }

    ctx.status = 200;
    ctx.body = { session: response.data.session };
    return next();
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

function getHealthCheck(ctx: Context, next: Next) {
  ctx.body = { health: "ok" };
  return next();
}
