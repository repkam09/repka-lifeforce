import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../../utils/LifeforcePlugin";
import { Logger } from "../../utils/logger";
import { WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { handleHennosMessage } from "./completion";
import { HennosMessage, buildErrorMessage } from "./types";
import { SupabaseClient, User } from "@supabase/supabase-js";

export class Hennos extends LifeforcePlugin {
  public prisma: PrismaClient;

  public supabase: SupabaseClient;

  public async init(): Promise<void> {
    Logger.info("Hennos initialized");
  }

  constructor(
    router: KoaRouter,
    prisma: PrismaClient,
    supabase: SupabaseClient
  ) {
    super(router);
    this.prisma = prisma;
    this.supabase = supabase;

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
    ]);
  }

  private async validateAuth(ctx: Context): Promise<{ token: string, user: User } | false> {
    if (ctx.query.token) {
      const user = await this.supabase.auth.getUser(ctx.query.token as string);
      if (user.error) {
        console.error(`Supabase error: ${user.error.message}`);
        return false;
      }

      if (user.data.user) {
        return {
          token: ctx.query.token as string,
          user: user.data.user
        };
      }
    }

    if (ctx.headers.authorization) {
      const user = await this.supabase.auth.getUser(ctx.headers.authorization as string);
      if (user.error) {
        console.error(`Supabase error: ${user.error.message}`);
        return false;
      }

      if (user.data.user) {
        return {
          token: ctx.headers.authorization as string,
          user: user.data.user
        };
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

    return;
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
