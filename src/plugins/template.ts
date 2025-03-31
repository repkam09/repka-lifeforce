import { Context, Next } from "koa";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";

export class Template extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Template initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);
    this.addHandlers([
      {
        path: "/api/example/example",
        type: "GET",
        handler: handleExampleFunction,
      },
    ]);
  }
}

function handleExampleFunction(ctx: Context, next: Next) {
  ctx.status = 200;
  ctx.body = "Hello World!";

  return next();
}
