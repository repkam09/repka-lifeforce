/* eslint-disable @typescript-eslint/no-explicit-any */
import KoaRouter from "koa-router";
import { Context, Next } from "koa";
import { WebSocket } from "ws";

export type LifeforcePluginEndpoint =
  | LifeforceHTTPPluginEndpoint
  | LifeforceWebsocketPluginEndpoint;

export type LifeforceHTTPPluginEndpoint = {
  path: string;
  type: "GET" | "POST";
  cacheTTL?: number;
  handler: KoaRouter.IMiddleware<any, any>;
};

export type LifeforceWebsocketPluginEndpoint = {
  path: string;
  type: "SOCKET";
  handler: (ctx: Context, ws: WebSocket) => void;
};

export abstract class LifeforcePlugin {
  public router: KoaRouter;

  constructor(router: KoaRouter) {
    this.router = router;
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
            return endpoint.handler(ctx, ws);
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
    });
  }

  public abstract init(): Promise<void>;
}
