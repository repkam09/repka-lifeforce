/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import fs from "fs";
import path from "path";
import querystring from "querystring";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";

export class RepCastNAS extends LifeforcePlugin {
  public init(): void {
    Logger.info("RepCastNAS initialized");
  }
  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/repcast/nas/getfiles/:filepath",
        type: "GET",
        handler: this.handleRepcastDirGet,
        cacheTTL: 86400,
      },
      {
        path: "/repcast/clearcache",
        type: "GET",
        handler: this.handleResetCache,
      },
      {
        path: "/repcast/nas/getfiles",
        type: "GET",
        handler: this.handleRepcastDirGet,
        cacheTTL: 86400,
      },
      {
        path: "/repcast/spaces/getfiles",
        type: "GET",
        handler: this.handleRepcastDirGet,
        cacheTTL: 86400,
      },
    ]);
  }

  private handleRepcastDirGet = async (ctx: Context, next: Next) => {
    const header = ctx.headers["repka-repcast-token"];
    if (!header || header !== Config.LIFEFORCE_AUTH_TOKEN) {
      ctx.status = 200;
      ctx.body = {};
      return next();
    }

    const temp = ctx.params.filepath
      ? Buffer.from(ctx.params.filepath, "base64").toString()
      : "";
    const cleaned = temp.replace(Config.LIFEFORCE_MEDIA_PREFIX, "");
    const filepath = `${Config.LIFEFORCE_MEDIA_MOUNT}${cleaned}`;

    try {
      const result = dirlist(filepath);

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
        details: "Error while getting file list",
      };

      return next();
    }
  };

  private handleResetCache = async (ctx: Context, next: Next) => {
    ctx.status = 200;
    ctx.body = "Cache cleared";
    return next();
  };
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

function dirlist(filepath: string) {
  // get the list of files in this directory:
  let files = fs.readdirSync(filepath);

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

  files.sort(function (a, b) {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const filelist: any[] = [];

  files.forEach((file) => {
    const fixpath = filepath.replace(Config.LIFEFORCE_MEDIA_PREFIX, "");

    const jsonstruct: any = {
      date: "",
      name: file,
      type: "file",
      key: "",
    };

    const stats = fs.statSync(filepath + file);
    // If something is a directory do some extra operations, and include it
    if (stats.isDirectory()) {
      jsonstruct.type = "dir";
      jsonstruct.key = Buffer.from(fixpath + file + "/").toString("base64");
    } else {
      const ext = path.extname(fixpath + file).replace(".", "");
      const fullpath =
        Config.LIFEFORCE_MEDIA_PREFIX +
        querystring.escape(fixpath + file) +
        "?auth=" +
        Config.LIFEFORCE_AUTH_TOKEN;
      jsonstruct.path = fullpath;
      jsonstruct.size = stats.size;
      jsonstruct.original = file;
      jsonstruct.mimetype = "application/octet-stream"; // ignore this for now
      jsonstruct.filetype = ext;
      jsonstruct.key = "";

      try {
        jsonstruct.date = timeSince(new Date(stats.mtime));
      } catch (err) {
        // Ignore that we cant get a proper date
      }
    }

    filelist.push(jsonstruct);
  });

  return filelist;
}
