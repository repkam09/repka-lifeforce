import Koa from "koa";
import KoaRouter from "koa-router";
import KoaBodyParser from "koa-bodyparser";
import KoaCors from "@koa/cors";

import { Logger } from "./utils/logger";
import { Config } from "./utils/config";
import { MetaEndpoints } from "./plugins/meta";
import { Music } from "./plugins/music";
import {
  blacklistMiddleware,
  rateLimitMiddleware,
  traceLogMiddleware,
} from "./utils/secure";
import { ElectionResults } from "./plugins/election";
import { RepCast } from "./plugins/repcast";
import { RepCastNAS } from "./plugins/repcastnas";
import { RaspiTempMonitor } from "./plugins/tempmon";
import { Weather } from "./plugins/weather";

function init() {
  Logger.info("Creating Koa Server...");

  const app = new Koa({
    proxy: true,
    proxyIpHeader: "X-Forwarded-For",
  });

  app.use(
    KoaCors({
      origin: "*",
      allowHeaders: ["cache-control", "repka-repcast-token", "repka-verify"],
      exposeHeaders: ["cache-control", "repka-repcast-token", "repka-verify"],
    })
  );

  app.use(KoaBodyParser());

  app.use(blacklistMiddleware);
  app.use(rateLimitMiddleware);
  app.use(traceLogMiddleware);

  const router = new KoaRouter();

  const plugins = [
    MetaEndpoints,
    Music,
    ElectionResults,
    RepCast,
    RepCastNAS,
    RaspiTempMonitor,
    Weather,
  ];
  plugins.forEach((Plugin) => {
    const temp = new Plugin(router);
    temp.init();
  });

  app.use(router.routes());

  Logger.info("Starting Koa Server...");
  app.listen(Config.LIFEFORCE_PORT, () => {
    Logger.info(`Listening at ${Config.LIFEFORCE_PUBLIC_URL}`);
  });
}

init();
