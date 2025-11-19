import Koa from "koa";
import KoaRouter from "koa-router";
import KoaBodyParser from "koa-bodyparser";
import KoaCors from "@koa/cors";
import KoaWebsocket from "koa-easy-ws";
import { createClient } from "@supabase/supabase-js";

import { Logger } from "./utils/logger";
import { Config } from "./utils/config";
import { MetaEndpoints } from "./plugins/meta";
import { Music } from "./plugins/music";
import { traceLogMiddleware } from "./utils/common";
import { RepCast } from "./plugins/repcast";
import { RaspiTempMonitor } from "./plugins/tempmon";
import { Weather } from "./plugins/weather";
import { Hennos } from "./plugins/hennos";
import { HomeAssistant } from "./plugins/home";
import { TRMNL } from "./plugins/trmnl";
import { PrismaClient } from "@prisma/client";
import { createMCPServer } from "./mcp";
import { Search } from "./plugins/search";
import { SSODebug } from "./plugins/saml";
import { OllamaWrapper } from "./plugins/ollama";
import { sendAdminNotification } from "./utils/notification";

async function init() {
  Logger.info("Creating Koa Server...");

  const app = new Koa({
    proxy: true,
    proxyIpHeader: "X-Forwarded-For",
  });

  const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_API_KEY);

  const prisma = new PrismaClient();

  app.use(
    KoaCors({
      origin: "*",
      allowHeaders: [
        "cache-control",
        "content-type",
        "authorization",
        "repka-repcast-token",
        "repka-verify",
      ],
      exposeHeaders: [
        "cache-control",
        "content-type",
        "authorization",
        "repka-repcast-token",
        "repka-verify",
      ],
    })
  );

  app.use(traceLogMiddleware);
  app.use(KoaWebsocket());
  app.use(KoaBodyParser());

  const router = new KoaRouter();
  const mcp = await createMCPServer(supabase, router);

  const plugins = [
    MetaEndpoints,
    Music,
    RepCast,
    RaspiTempMonitor,
    Weather,
    Hennos,
    HomeAssistant,
    TRMNL,
    Search,
    SSODebug,
    OllamaWrapper,
  ];

  const setup = plugins.map((Plugin) => {
    const temp = new Plugin({
      router,
      prisma,
      supabase,
      mcp,
    });
    return temp.init();
  });

  await Promise.all(setup);

  app.use(router.routes());
  app.use(router.allowedMethods());

  Logger.info("Starting Koa Server...");
  sendAdminNotification(
    `Lifeforce Server Started - ${new Date().toISOString()}`
  );
  app
    .listen(Config.LIFEFORCE_PORT, () => {
      Logger.info(`Listening at ${Config.LIFEFORCE_PUBLIC_URL}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on("clientError", (error: any, socket: any) => {
      // This seems insane, but sure, why not.
      // https://github.com/b3nsn0w/koa-easy-ws/issues/36
      if (error.code === "ERR_HTTP_REQUEST_TIMEOUT" && socket.ignoreTimeout) {
        return;
      }

      Logger.error(`Client error: ${error.message}`);
      socket.destroy();
    });
}

init();
