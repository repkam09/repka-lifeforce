/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../../utils/LifeforcePlugin";
import { Logger } from "../../utils/logger";
import { WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { handleHennosMessage } from "./completion";
import { HennosMessage, buildErrorMessage } from "./types";
import {
  createClient,
  AdminUserAttributes,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { Config } from "../../utils/config";

// Clear cache every minute
const CACHE_TTL = 1000 * 60;

export class Hennos extends LifeforcePlugin {
  public prisma: PrismaClient;
  public supabase: SupabaseClient;
  public supabaseAdmin: SupabaseClient;
  private cache: Map<string, any> = new Map();

  public async init(): Promise<void> {
    Logger.info("Hennos initialized");

    setInterval(() => {
      Logger.debug("Clearing Hennos Data Cache");
      this.cache.clear();
    }, CACHE_TTL);
  }

  constructor(
    router: KoaRouter,
    prisma: PrismaClient,
    supabase: SupabaseClient
  ) {
    super(router);
    this.prisma = prisma;
    this.supabase = supabase;

    this.supabaseAdmin = createClient(
      Config.SUPABASE_URL,
      Config.SUPABASE_SERVICE_KEY
    );

    this.addHandlers([
      {
        path: "/api/hennos/socket/:userId",
        type: "SOCKET",
        handler: this.handleHennosWebsocket.bind(this),
      },
      {
        path: "/api/hennos/user",
        type: "GET",
        handler: this.handleHennosUserFetch.bind(this),
      },
      {
        path: "/api/hennos/users",
        type: "GET",
        handler: this.handleHennosUsersFetch.bind(this),
      },
      {
        path: "/api/hennos/user/:userId",
        type: "GET",
        handler: this.handleHennosUserFetchById.bind(this),
      },
      {
        path: "/api/hennos/user/:userId",
        type: "POST",
        handler: this.handleHennosUserUpdateById.bind(this),
      },
    ]);
  }

  private async validateAdminAuth(
    ctx: Context
  ): Promise<{ token: string; user: User } | false> {
    const user = await this.validateAuth(ctx);
    if (!user) {
      return false;
    }

    if (!Config.LIFEFORCE_ADMIN_UUIDS.includes(user.user.id)) {
      return false;
    }

    return { token: user.token, user: user.user };
  }

  private async validateAuth(
    ctx: Context
  ): Promise<{ token: string; user: User } | false> {
    if (ctx.query.token) {
      // check if we have a cached result for this token
      const cachedUser = this.cache.get(ctx.query.token as string);
      if (cachedUser) {
        console.log("Returning cached user from token");
        return cachedUser;
      }

      const user = await this.supabase.auth.getUser(ctx.query.token as string);
      if (user.error) {
        console.error(`Supabase error: ${user.error.message}`);
        return false;
      }

      if (user.data.user) {
        const result = {
          token: ctx.query.token as string,
          user: user.data.user,
        };

        this.cache.set(ctx.query.token as string, result);
        return result;
      }
    }

    if (ctx.headers.authorization) {
      // check if we have a cached result for this token
      const cachedUser = this.cache.get(ctx.headers.authorization as string);
      if (cachedUser) {
        console.log("Returning cached user from header");
        return cachedUser;
      }

      const user = await this.supabase.auth.getUser(
        ctx.headers.authorization as string
      );
      if (user.error) {
        console.error(`Supabase error: ${user.error.message}`);
        return false;
      }

      if (user.data.user) {
        const result = {
          token: ctx.headers.authorization as string,
          user: user.data.user,
        };

        this.cache.set(ctx.headers.authorization as string, result);
        return result;
      }
    }

    return false;
  }

  private async handleHennosUserFetch(ctx: Context, next: Next) {
    const user = await this.validateAuth(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        error: "Unauthorized",
      };
      return next();
    }

    ctx.status = 200;
    ctx.body = {
      error: false,
      data: user,
    };

    return next();
  }

  private async handleHennosUsersFetch(ctx: Context, next: Next) {
    const user = await this.validateAdminAuth(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        error: "Unauthorized",
      };
      return next();
    }

    const cachedUsers = this.cache.get("users");
    if (cachedUsers) {
      ctx.status = 200;
      ctx.body = {
        cached: true,
        error: false,
        data: cachedUsers,
      };
    }

    const users = await this.supabaseAdmin.auth.admin.listUsers();
    if (users.error) {
      ctx.status = 500;
      ctx.body = {
        error: "Internal Error",
      };

      return next();
    }

    ctx.status = 200;
    const result = {
      cached: false,
      error: false,
      data: users.data.users,
    };
    this.cache.set("users", result);
    ctx.body = result;
    return next();
  }

  private async handleHennosUserFetchById(ctx: Context, next: Next) {
    const user = await this.validateAdminAuth(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        error: "Unauthorized",
      };
      return next();
    }

    const userById = await this.supabaseAdmin.auth.admin.getUserById(
      ctx.params.userId as string
    );

    if (userById.error) {
      ctx.status = 400;
      ctx.body = {
        error: "Invalid UserId",
      };
      return next();
    }

    ctx.status = 200;
    ctx.body = {
      error: false,
      data: userById.data.user,
    };

    return next();
  }

  private async handleHennosUserUpdateById(ctx: Context, next: Next) {
    const user = await this.validateAdminAuth(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        error: "Unauthorized",
      };
      return next();
    }

    const userById = await this.supabaseAdmin.auth.admin.updateUserById(
      ctx.params.userId as string,
      ctx.request.body as AdminUserAttributes
    );

    if (userById.error) {
      ctx.status = 400;
      ctx.body = {
        error: "Bad Request",
      };
      return next();
    }

    ctx.status = 200;
    ctx.body = {
      error: false,
      data: userById.data.user,
    };

    return next();
  }

  private async validateHennosUserConnection(
    ctx: Context
  ): Promise<{ userId: string } | false> {
    if (!ctx.params.userId || !ctx.query.token) {
      console.warn("Missing userId or token");
      return false;
    }

    const user = await this.supabase.auth.getUser(ctx.query.token as string);
    if (user.error) {
      console.error(`Supabase error: ${user.error.message}`);
      return false;
    }

    if (!user.data.user) {
      console.warn("Supabase returned no user data.");
      return false;
    }

    if (user.data.user.id !== ctx.params.userId) {
      console.warn(`Supabase user ID ${user.data.user.id} does not match.`);
      return false;
    }

    console.log(`User ${user.data.user.id} validated via Supabase`);
    return {
      userId: user.data.user.id,
    };
  }

  private async handleHennosWebsocket(ctx: Context, ws: WebSocket) {
    const valid = await this.validateHennosUserConnection(ctx);
    if (!valid) {
      return ws.close();
    }

    Logger.info(`HennosUser ${valid.userId} Connected`);
    ws.on("error", (err) => {
      Logger.error(`HennosUser ${valid.userId} Error: ${err}`);
    });

    ws.on("upgrade", () => {
      Logger.debug(`HennosUser ${valid.userId} Upgraded Connection`);
    });

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString()) as object;
        if (!Object.prototype.hasOwnProperty.call(data, "__type")) {
          throw new Error("Invalid, missing __type");
        }

        if (!Object.prototype.hasOwnProperty.call(data, "value")) {
          throw new Error("Invalid, missing value");
        }

        handleHennosMessage(
          valid.userId,
          data as HennosMessage,
          (res: HennosMessage) => {
            ws.send(JSON.stringify(res));
          }
        );
      } catch (err: unknown) {
        Logger.error(`HennosUser ${valid.userId} Error: ${err}`);
        const error = err as Error;
        ws.send(JSON.stringify(buildErrorMessage(error.message)));
      }
    });

    ws.on("close", () => {
      Logger.info(`HennosUser ${valid.userId} Disconnected`);
    });

    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ __type: "keep-alive" }));
      }

      if (ws.readyState === ws.CLOSED) {
        clearInterval(interval);
      }
    }, 5000);
  }
}
