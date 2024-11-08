import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import axios from "axios";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Config } from "../utils/config";

export class Music extends LifeforcePlugin {
  public init(): void {
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
    const url =
      "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&user=" +
      ctx.params.name +
      "&api_key=" +
      Config.LAST_FM_API_KEY +
      "&format=json";

    const stream = await axios({
      method: "get",
      url,
      responseType: "stream",
    });

    stream.data.pipe(ctx.res);
  } else {
    ctx.status = 400;
    ctx.body = "Bad Request";
  }

  return next();
}

async function handleGetMusicRecent(ctx: Context, next: Next) {
  if (ctx.params.name) {
    const url =
      "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" +
      ctx.params.name +
      "&api_key=" +
      Config.LAST_FM_API_KEY +
      "&format=json";
    const stream = await axios({
      method: "get",
      url,
      responseType: "stream",
    });

    await stream.data.pipe(ctx.res);
  } else {
    ctx.status = 400;
    ctx.body = "Bad Request";
  }

  return next();
}
