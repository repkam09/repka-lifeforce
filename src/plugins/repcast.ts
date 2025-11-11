/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import Transmission from "transmission";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";

export class RepCast extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("RepCast Plugin initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);
    this.addHandlers([
      {
        path: "/repcast/toradd/:magnet",
        type: "GET",
        handler: this.handleRepcastTorAdd.bind(this),
      },
      {
        path: "/repcast/nas/getfiles/:filepath",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
      },
      {
        path: "/repcast/nas/getfiles",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
      },
      {
        path: "/repcast/spaces/getfiles",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
      },
      {
        path: "/repcast/spaces/getfiles/:filepath",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
      },
    ]);
  }

  private async handleRepcastDirGet(ctx: Context, next: Next) {
    ctx.status = 200;
    ctx.body = {
      error: false,
      status: "cache",
      count: 1,
      info: [
        {
          date: "November 2025",
          name: "RepCast support has ended. Please migrate to Jellyfin.",
          type: "dir",
          key: "mock",
        },
      ],
    };
    return next();
  }

  private async handleRepcastTorAdd(ctx: Context, next: Next) {
    try {
      const magnet = Buffer.from(ctx.params.magnet, "base64").toString();

      const instance = new Transmission({
        port: Config.TRANSMISION_PORT,
        host: Config.TRANSMISSION_HOST,
        username: Config.TRANSMISSION_USER,
        password: Config.TRANSMISION_PASS,
      });

      instance.addUrl(magnet, (err, result) => {
        if (err) {
          console.error(`Error returned while adding torrent: ${err.message}`);

          ctx.status = 500;
          ctx.body = {
            error: true,
            data: err.message,
          };
        } else {
          console.log(`Torrent added: ${JSON.stringify(result)}`);

          ctx.status = 200;
          ctx.body = {
            error: false,
            data: result,
          };
        }

        return next();
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Error thrown while adding torrent: ${error.message}`);

      ctx.status = 500;
      ctx.body = {
        error: true,
        data: error.message,
      };

      return next();
    }
  }
}
