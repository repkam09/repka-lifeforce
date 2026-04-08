import { Context, Next } from "koa";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";

export class Logging extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Logging Plugin initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.addHandlers([
      {
        path: "/api/logging/event",
        type: "POST",
        auth: false,
        handler: handlePostEvent,
      },
      {
        path: "/api/logging/event/:source",
        type: "POST",
        auth: false,
        handler: handlePostEvent,
      },
    ]);
  }
}

async function handlePostEvent(ctx: Context, next: Next) {
  const source = ctx.params.source || "default";
  const event = ctx.request.body;

  Logger.info(`[${source}] ${JSON.stringify(event)}`);

  ctx.status = 200;
  ctx.body = { status: "ok" };
  return next();
}
