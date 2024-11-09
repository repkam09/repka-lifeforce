import Koa from "koa";
import KoaRouter from "koa-router";
import KoaBodyParser from "koa-bodyparser";
import KoaCors from "@koa/cors";

import { Logger } from "./utils/logger";
import { Config } from "./utils/config";
import { MetaEndpoints } from "./plugins/meta";
import { Music } from "./plugins/music";
import {
  whitelistMiddleware,
  rateLimitMiddleware,
  traceLogMiddleware,
} from "./utils/common";
import { RepCast } from "./plugins/repcast";
import { RepCastNAS } from "./plugins/repcastnas";
import { RaspiTempMonitor } from "./plugins/tempmon";
import { Weather } from "./plugins/weather";
import { Hennos } from "./plugins/hennos";

async function init() {
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

  app.use(traceLogMiddleware);
  app.use(whitelistMiddleware);
  app.use(rateLimitMiddleware);
  app.use(KoaBodyParser());

  const router = new KoaRouter();

  const plugins = [
    MetaEndpoints,
    Music,
    RepCast,
    RepCastNAS,
    RaspiTempMonitor,
    Weather,
    Hennos,
  ];

  const setup = plugins.map((Plugin) => {
    const temp = new Plugin(router);
    return temp.init();
  });

  await Promise.all(setup);

  app.use(router.routes());

  Logger.info("Starting Koa Server...");
  app.listen(Config.LIFEFORCE_PORT, () => {
    Logger.info(`Listening at ${Config.LIFEFORCE_PUBLIC_URL}`);
  });
}

init();
