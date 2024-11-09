/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import fspromise from "fs/promises";
import path from "path";
import querystring from "node:querystring";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";
import mimetype from "mime-types";
import * as KoaSend from "@koa/send";
import { v4 } from "uuid";

const TOKEN_ROTATION = 1000 * 60 * 60; // 1 hour

export class RepCastNAS extends LifeforcePlugin {
  private sample: object = {};
  private temp_token: string = v4();

  public async init(): Promise<void> {
    // load in the sample response file
    const file = path.join(__dirname, "../../static/example_repcast.json");
    const sample = await fspromise.readFile(file, "utf8");

    this.sample = JSON.parse(sample);

    setInterval(() => {
      this.temp_token = v4();
      Logger.debug("Rotated RepCast Token: " + this.temp_token);
    }, TOKEN_ROTATION);
  }
  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/repcast/nas/getfiles/:filepath",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
        cacheTTL: 86400,
      },
      {
        path: "/repcast/clearcache",
        type: "GET",
        handler: this.handleResetCache.bind(this),
      },
      {
        path: "/repcast/nas/getfiles",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
        cacheTTL: 86400,
      },
      {
        path: "/repcast/spaces/getfiles",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
        cacheTTL: 86400,
      },
      {
        path: "/repcast/spaces/getfiles/:filepath",
        type: "GET",
        handler: this.handleRepcastDirGet.bind(this),
        cacheTTL: 86400,
      },
      {
        path: "/repcast/filesrv/:filepath",
        type: "GET",
        handler: this.handleRepcastFileSrv.bind(this),
      },
    ]);
  }

  private async handleRepcastFileSrv(ctx: Context, next: Next) {
    if (!hasRepCastAuth(ctx, this.temp_token)) {
      Logger.warn(
        "Attempted unauthorized access to RepCast NAS, token mismatch"
      );
      ctx.status = 401;
      ctx.body = {
        error: true,
      };
      return next();
    }

    await KoaSend.send(ctx, ctx.params.filepath, {
      root: Config.LIFEFORCE_MEDIA_MOUNT,
    });
  }

  private async handleRepcastDirGet(ctx: Context, next: Next) {
    if (!hasRepCastAuth(ctx, Config.LIFEFORCE_REPCAST_TOKEN)) {
      Logger.warn(
        "Attempted unauthorized access to RepCast NAS, token mismatch"
      );
      ctx.status = 200;
      ctx.body = this.sample;
      return next();
    }

    const temp = ctx.params.filepath
      ? Buffer.from(ctx.params.filepath, "base64").toString()
      : "";
    const cleared = temp.replace(Config.LIFEFORCE_MEDIA_MOUNT, "");
    const filepath = `${Config.LIFEFORCE_MEDIA_MOUNT}${cleared}`;

    try {
      const result = await this.dirlist(filepath);

      ctx.status = 200;
      ctx.body = {
        error: false,
        status: "live",
        count: result.length,
        info: result,
      };

      return next();
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        error: true,
        status: "error",
        count: 0,
        info: [],
      };

      return next();
    }
  }

  private handleResetCache = async (ctx: Context, next: Next) => {
    ctx.status = 200;
    ctx.body = "Cache cleared";
    return next();
  };

  private async dirlist(filepath: string) {
    // get the list of files in this directory:
    let files = await fspromise.readdir(filepath);

    // Strip bad files from the list before even processing them
    files = files.filter((file) => {
      if (file.startsWith(".")) {
        return false;
      }

      if (file.startsWith("@eaDir")) {
        return false;
      }

      if (file.endsWith(".bak")) {
        return false;
      }

      if (file.endsWith(".nfo")) {
        return false;
      }

      return true;
    });

    files.sort((a, b) => {
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const filePromises = files.map(async (file) => {
      const fixpath = filepath.replace(Config.LIFEFORCE_MEDIA_MOUNT, "");

      const jsonstruct: any = {
        date: "",
        name: file,
        type: "file",
        key: "",
      };

      const stats = await fspromise.stat(filepath + file);
      // If something is a directory do some extra operations, and include it
      if (stats.isDirectory()) {
        jsonstruct.type = "dir";
        jsonstruct.key = Buffer.from(fixpath + file + "/").toString("base64");
      } else {
        const ext = path.extname(fixpath + file).replace(".", "");
        const fullpath = `${Config.LIFEFORCE_MEDIA_PREFIX}${querystring.escape(
          fixpath + file
        )}?token=${this.temp_token}`;
        jsonstruct.path = fullpath;
        jsonstruct.size = stats.size;
        jsonstruct.original = file;
        jsonstruct.mimetype =
          mimetype.lookup(ext) || "application/octet-stream";
        jsonstruct.filetype = ext;
        jsonstruct.key = Buffer.from(fixpath + file).toString("base64");
        try {
          jsonstruct.date = timeSince(new Date(stats.mtime));
        } catch (err) {
          // Ignore that we cant get a proper date
        }
      }

      return jsonstruct;
    });

    return Promise.all(filePromises);
  }
}

function timeSince(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

function hasRepCastAuth(ctx: Context, temp: string): boolean {
  const repcast = ctx.headers["repka-repcast-token"];
  if (repcast && repcast === temp) {
    Logger.debug("hasRepCastAuth: repcast header match");
    return true;
  }

  const query = ctx.query.token;
  if (query && query === temp) {
    Logger.debug("hasValidAuth: query match");
    return true;
  }

  return false;
}
