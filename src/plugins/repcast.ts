/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import Transmission from "transmission";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import fspromise from "fs/promises";
import path from "path";
import querystring from "node:querystring";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";
import mimetype from "mime-types";
import * as KoaSend from "@koa/send";
import { v4 } from "uuid";

// Swap file tokens every 10 hours
const TOKEN_ROTATION = 1000 * 60 * 60 * 10;

// Clear cache every 1 hour
const CACHE_TTL = 1000 * 60 * 60;

export class RepCast extends LifeforcePlugin {
  private sample: object = {};
  private temp_token: string = v4();
  private cache: Map<string, any> = new Map();

  public async init(): Promise<void> {
    // load in the sample response file
    const file = path.join(__dirname, "../../static/example_repcast.json");
    const sample = await fspromise.readFile(file, "utf8");

    this.sample = JSON.parse(sample);

    setInterval(() => {
      this.temp_token = v4();
      Logger.debug("Rotated RepCast Token: " + this.temp_token);
    }, TOKEN_ROTATION);

    setInterval(() => {
      Logger.debug("Clearing RepCast Cache");
      this.cache.clear();
    }, CACHE_TTL);
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

    const limitString = Array.isArray(ctx.query.limit)
      ? ctx.query.limit[0]
      : ctx.query.limit;

    const limit = limitString ? parseInt(limitString) : undefined;

    try {
      const cached = this.cache.get(`${filepath}|${limit}`) as any[];
      if (cached) {
        ctx.status = 200;
        ctx.body = {
          error: false,
          status: "cache",
          count: cached.length,
          info: cached,
        };
        return next();
      }

      const result = await this.dirlist(filepath, limit);
      this.cache.set(`${filepath}|${limit}`, result);

      ctx.status = 200;
      ctx.body = {
        error: false,
        status: "live",
        count: result.length,
        info: result,
      };

      return next();
    } catch (err) {
      const error = err as Error;
      ctx.status = 500;
      ctx.body = {
        error: true,
        status: "error",
        count: 0,
        info: [],
      };

      Logger.error(
        "Error reading directory: " + filepath + ", " + error.message
      );
      return next();
    }
  }

  private handleResetCache = async (ctx: Context, next: Next) => {
    this.cache.clear();
    ctx.status = 200;
    ctx.body = "Cache cleared";
    return next();
  };

  private async dirlist(filepath: string, limit: number | undefined) {
    Logger.debug("Reading directory: " + filepath);

    // get the list of files in this directory:
    let files = await fspromise.readdir(filepath);

    Logger.debug("Found " + files.length + " files in " + filepath);

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

    Logger.debug("Stripped bad files, now have " + files.length + " files");

    if (limit) {
      Logger.debug("Limiting files to first " + limit);
      files = files.slice(0, limit);
    }

    files.sort((a, b) => {
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const filePromises = files.map(async (file) => {
      const fixpath = filepath.replace(Config.LIFEFORCE_MEDIA_MOUNT, "");

      Logger.debug("Processing file: " + file + " in " + fixpath);

      const jsonstruct: any = {
        date: "",
        name: file,
        type: "file",
        key: "",
      };

      if (filepath.endsWith("/")) {
        Logger.debug("Stripping trailing slash from filepath" + filepath);
        filepath = filepath.slice(0, -1);
      }

      const statPath = filepath + "/" + file;
      Logger.debug("Getting stats for : " + statPath);

      let stats: any;
      try {
        stats = await fspromise.stat(statPath);
      } catch (err) {
        const error = err as Error;
        Logger.error(
          "Error getting stats for: " + statPath + ", " + error.message
        );
        return null;
      }

      // If something is a directory do some extra operations, and include it
      if (stats.isDirectory()) {
        jsonstruct.type = "dir";
        const dirPath = fixpath + "/" + file + "/";
        Logger.debug("Found directory: " + dirPath);
        jsonstruct.key = Buffer.from(dirPath).toString("base64");
      } else {
        const filePath = fixpath + file;
        Logger.debug("Found file: " + filePath);
        const ext = path.extname(filePath).replace(".", "");
        const fullpath = `${Config.LIFEFORCE_MEDIA_PREFIX}${querystring.escape(
          filePath
        )}?token=${this.temp_token}`;
        jsonstruct.path = fullpath;
        jsonstruct.size = stats.size;
        jsonstruct.original = file;
        jsonstruct.mimetype =
          mimetype.lookup(ext) || "application/octet-stream";
        jsonstruct.filetype = ext;
        jsonstruct.key = Buffer.from(filePath).toString("base64");
        try {
          jsonstruct.date = timeSince(new Date(stats.mtime));
        } catch (err) {
          // Ignore that we cant get a proper date
        }
      }

      return jsonstruct;
    });

    const results = await Promise.all(filePromises);
    const filtered = results.filter((result) => result !== null);
    return filtered;
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
    return true;
  }

  const query = ctx.query.token;
  if (query && query === temp) {
    return true;
  }

  return false;
}
