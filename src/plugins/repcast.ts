import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import Transmission from "transmission";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";

export class RepCast extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("RepCast initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/repcast/toradd/:magnet",
        type: "GET",
        handler: handleRepcastTorAdd,
      },
    ]);
  }
}

function handleRepcastTorAdd(ctx: Context, next: Next) {
  try {
    const magnet = Buffer.from(ctx.params.magnet, "base64").toString();

    const instance = new Transmission({
      port: Config.TRANSMISION_PORT,
      host: Config.TRANSMISSION_HOST,
      username: Config.TRANSMISSION_USER,
      password: Config.TRANSMISION_PASS,
    });
    instance.addUrl(magnet, {}, (err, result) => {
      if (err) {
        ctx.status = 500;
        ctx.body = {
          error: err.message,
        };
      } else {
        ctx.status = 200;
        ctx.body = result;
      }
    });
  } catch (err) {
    const error = err as Error;
    ctx.status = 500;
    ctx.body = {
      error: error.message,
    };
  }

  return next();
}
