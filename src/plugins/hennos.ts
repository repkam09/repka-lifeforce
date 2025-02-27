/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { RawData, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { HennosSessionHandler } from "../hennos/sessions";
import {
  createClient,
  AdminUserAttributes,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { Config } from "../utils/config";
import { randomUUID } from "crypto";
import { handleUserMessage } from "../hennos/completion";
import { HennosCacheHandler, HennosStorageHandler } from "../hennos/storage";
import { validateAdminAuth, validateAuth } from "../utils/validation";
import {
  returnBadRequest,
  returnInternalError,
  returnSuccess,
  returnUnauthorized,
} from "../utils/response";

export class Hennos extends LifeforcePlugin {
  public prisma: PrismaClient;
  public supabase: SupabaseClient;
  public supabaseAdmin: SupabaseClient;

  // Clear cache every minute
  private CACHE_TTL = 1000 * 60;

  public async init(): Promise<void> {
    Logger.info("Hennos initialized");

    setInterval(() => {
      HennosCacheHandler.clear();
    }, this.CACHE_TTL);
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
        path: "/api/hennos/socket",
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
      {
        path: "/api/hennos/history",
        type: "GET",
        handler: this.handleHennosHistoryFetch.bind(this),
      },
    ]);
  }

  private async handleHennosHistoryFetch(ctx: Context, next: Next) {
    const user = await validateAuth(this.supabase, ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }

    const history = HennosStorageHandler.get(user.user.id);
    return returnSuccess(false, history, ctx, next);
  }

  private async handleHennosUserFetch(ctx: Context, next: Next) {
    const user = await validateAuth(this.supabase, ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }
    return returnSuccess(false, user, ctx, next);
  }

  private async handleHennosUsersFetch(ctx: Context, next: Next) {
    const user = await validateAdminAuth(this.supabase, ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }

    const cachedUsers = HennosCacheHandler.get<User[]>("fetch-users-request");
    if (cachedUsers) {
      return returnSuccess(true, cachedUsers, ctx, next);
    }

    const users = await this.supabaseAdmin.auth.admin.listUsers();
    if (users.error) {
      return returnInternalError(ctx, next);
    }

    HennosCacheHandler.set("fetch-users-request", users.data.users);
    return returnSuccess(false, users.data.users, ctx, next);
  }

  private async handleHennosUserFetchById(ctx: Context, next: Next) {
    const user = await validateAdminAuth(this.supabase, ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }

    const userById = await this.supabaseAdmin.auth.admin.getUserById(
      ctx.params.userId as string
    );

    if (userById.error) {
      return returnBadRequest(ctx, next);
    }

    return returnSuccess(false, userById.data.user, ctx, next);
  }

  private async handleHennosUserUpdateById(ctx: Context, next: Next) {
    const user = await validateAdminAuth(this.supabase, ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }

    const userById = await this.supabaseAdmin.auth.admin.updateUserById(
      ctx.params.userId as string,
      ctx.request.body as AdminUserAttributes
    );

    if (userById.error) {
      return returnBadRequest(ctx, next);
    }
    return returnSuccess(false, userById.data.user, ctx, next);
  }

  private async handleHennosWebsocket(ctx: Context, ws: WebSocket) {
    const valid = await validateAuth(this.supabase, ctx);
    if (!valid) {
      return ws.close();
    }

    const socketId = randomUUID();
    const userId = valid.user.id;

    Logger.info(`HennosUser ${userId} Connected (socket: ${socketId})`);
    HennosSessionHandler.register(userId, socketId, ws);

    ws.on("error", (err) => {
      Logger.error(`HennosUser ${userId} Error: ${err}`);
      HennosSessionHandler.unregister(userId, socketId);
    });

    ws.on("message", (raw: RawData) => {
      try {
        handleUserMessage(userId, JSON.parse(raw.toString()));
      } catch (err: unknown) {
        Logger.debug(`HennosUser ${userId} Invalid Message: ${raw.toString()}`);
      }
    });

    ws.on("close", () => {
      Logger.info(`HennosUser ${userId} Disconnected`);
      HennosSessionHandler.unregister(userId, socketId);
    });
  }
}
