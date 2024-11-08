import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import axios from "axios";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";

export class Music extends LifeforcePlugin {
  public async init(): Promise<void> {
    console.log("Music initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/music/now/:name",
        type: "GET",
        handler: handleGetMusicNow,
      },
      {
        path: "/api/music/recent/:name",
        type: "GET",
        handler: handleGetMusicRecent,
      },
    ]);
  }
}

async function handleGetMusicNow(ctx: Context, next: Next) {
  if (ctx.params.name) {
    Logger.debug(`Looking up now playing music for ${ctx.params.name}`);
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&user=${ctx.params.name}&api_key=${Config.LAST_FM_API_KEY}&format=json`;

    const response = await axios.get(url);
    ctx.status = 200;
    ctx.body = response.data;
  } else {
    ctx.status = 400;
    ctx.body = "Bad Request";
  }
  return next();
}

async function handleGetMusicRecent(ctx: Context, next: Next) {
  if (ctx.params.name) {
    Logger.debug(`Looking up recent music for ${ctx.params.name}`);
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${ctx.params.name}&api_key=${Config.LAST_FM_API_KEY}&format=json`;

    const response = await axios.get(url);
    ctx.status = 200;
    ctx.body = response.data;
  } else {
    ctx.status = 400;
    ctx.body = "Bad Request";
  }

  return next();
}
