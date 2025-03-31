/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

import KoaRouter from "koa-router";
import { Context, Next } from "koa";
import { WebSocket } from "ws";
import { Config } from "./config";

export type LifeforcePluginEndpoint =
  | LifeforceHTTPPluginEndpoint
  | LifeforceWebsocketPluginEndpoint;

export type LifeforceHTTPPluginEndpoint = {
  path: string;
  type: "GET" | "POST";
  cacheTTL?: number;
  handler: KoaRouter.IMiddleware<any, any>;
  auth?: boolean;
};

export type LifeforceWebsocketPluginEndpoint = {
  path: string;
  type: "SOCKET";
  handler: (ctx: Context, ws: WebSocket) => void;
};

export type LifeforePluginConfiguration = {
  router: KoaRouter;
  prisma: PrismaClient;
  supabase: SupabaseClient;
  mcp: McpServer;
};

export abstract class LifeforcePlugin {
  public router: KoaRouter;
  public prisma: PrismaClient;
  public supabase: SupabaseClient;
  public mcp: McpServer;

  constructor(input: LifeforePluginConfiguration) {
    this.router = input.router;
    this.prisma = input.prisma;
    this.supabase = input.supabase;
    this.mcp = input.mcp;
  }

  public addHandlers(endpoints: LifeforcePluginEndpoint[]): void {
    const router = this.router;
    endpoints.forEach((endpoint) => {
      if (endpoint.type === "SOCKET") {
        router.register(
          endpoint.path,
          ["GET"],
          async (ctx: any, next: Next) => {
            if (!ctx.ws) {
              return next();
            }

            const ws = await ctx.ws();
            ctx.req.socket.ignoreTimeout = true;
            return endpoint.handler(ctx, ws);
          },
          {
            name: this.constructor.name,
          }
        );
      } else {
        if (endpoint.auth) {
          router.register(
            endpoint.path,
            [endpoint.type],
            async (ctx: Context, next: Next) => {
              if (hasValidAuth(ctx)) {
                return endpoint.handler(ctx, next);
              } else {
                ctx.status = 401;
                ctx.body = "Unauthorized";
                return next();
              }
            },
            {
              name: this.constructor.name,
            }
          );
        } else {
          router.register(endpoint.path, [endpoint.type], endpoint.handler, {
            name: this.constructor.name,
          });
        }
      }
    });
  }

  public abstract init(): Promise<void>;
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
