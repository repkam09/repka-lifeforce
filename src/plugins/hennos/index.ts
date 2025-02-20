import { Context } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../../utils/LifeforcePlugin";
import { Logger } from "../../utils/logger";
import { WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { Config } from "../../utils/config";
import { handleHennosMessage } from "./completion";
import { HennosMessage, buildErrorMessage } from "./types";

export class Hennos extends LifeforcePlugin {
  public prisma: PrismaClient;

  public async init(): Promise<void> {
    Logger.info("Hennos initialized");
  }

  constructor(router: KoaRouter, prisma: PrismaClient) {
    super(router);
    this.prisma = prisma;

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
        const data = JSON.parse(msg.toString()) as object;
        if (!Object.prototype.hasOwnProperty.call(data, "__type")) {
          throw new Error("Invalid, missing __type");
        }

        if (!Object.prototype.hasOwnProperty.call(data, "value")) {
          throw new Error("Invalid, missing value");
        }

        Logger.debug(`HennosUser ${valid.userId} Message: ${msg}`);
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
