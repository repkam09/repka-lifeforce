import { Context } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../../utils/LifeforcePlugin";
import { Logger } from "../../utils/logger";
import { WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { Config } from "../../utils/config";

export class Hennos extends LifeforcePlugin {
  public prisma: PrismaClient;
  private chat: Map<string, [{ from: string; data: string }]>;

  public async init(): Promise<void> {
    Logger.info("Hennos initialized");
  }

  constructor(router: KoaRouter, prisma: PrismaClient) {
    super(router);
    this.prisma = prisma;
    this.chat = new Map();

    this.addHandlers([
      {
        path: "/api/hennos/socket/:userId",
        type: "SOCKET",
        handler: this.handleHennosWebsocket.bind(this),
      },
    ]);
  }

  private async validateHennosUserConnection(
    ctx: Context
  ): Promise<{ userId: string } | false> {
    if (!ctx.params.userId || !ctx.query.token) {
      return false;
    }

    if (ctx.query.token !== Config.LIFEFORCE_AUTH_TOKEN) {
      return false;
    }

    return {
      userId: ctx.params.userId,
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
        const data = JSON.parse(msg.toString()) as {
          __type: string;
          value: unknown;
        };

        if (data.__type === "message") {
          Logger.info(`HennosUser ${valid.userId} Message: ${data.value}`);
          if (!this.chat.has(valid.userId)) {
            this.chat.set(valid.userId, [] as any);
          }

          const history = this.chat.get(valid.userId)!;

          history.push({
            from: "user",
            data: data.value as string,
          });

          history.push({
            from: "assistant",
            data: "response",
          });
          this.chat.set(valid.userId, history);
          ws.send(JSON.stringify({ __type: "message", value: "Response" + data.value }));
        }

        if (data.__type === "history") {
          Logger.info(`HennosUser ${valid.userId} History Request`);
          ws.send(
            JSON.stringify({
              __type: "history",
              value: this.chat.get(valid.userId) ?? [],
            })
          );
        }
      } catch (err) {
        Logger.error(`HennosUser ${valid.userId} Error: ${err}`);
        ws.send(JSON.stringify({ __type: "error", value: "Invalid Message" }));
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
