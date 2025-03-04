import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";

export class HomeAssistant extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("HomeAssistant initialized");
  }

  constructor(router: KoaRouter) {
    super(router);

    if (!Config.HOME_ASSISTANT_TOKEN || !Config.HOME_ASSISTANT_URL) {
      Logger.error("Home Assistant token is not configured. Disabling plugin.");
      return;
    }

    this.addHandlers([
      {
        path: "/api/home/entities",
        type: "GET",
        auth: true,
        handler: handleGetEntities,
      },
      {
        path: "/api/home/entity/:entity_id",
        type: "GET",
        auth: true,
        handler: handleGetEntity,
      },
    ]);
  }
}

async function handleGetEntities(ctx: Context, next: Next) {
  const result = await fetch(`${Config.HOME_ASSISTANT_URL}/api/states`, {
    headers: {
      Authorization: "Bearer " + Config.HOME_ASSISTANT_TOKEN,
      "Content-Type": "application/json",
    },
  });

  const json = await result.json();

  ctx.status = 200;
  ctx.body = json;
  return next();
}

async function handleGetEntity(ctx: Context, next: Next) {
  const result = await fetch(
    `${Config.HOME_ASSISTANT_URL}/api/states/${ctx.params.entity_id}`,
    {
      headers: {
        Authorization: "Bearer " + Config.HOME_ASSISTANT_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  const json = await result.json();

  ctx.status = 200;
  ctx.body = json;
  return next();
}
