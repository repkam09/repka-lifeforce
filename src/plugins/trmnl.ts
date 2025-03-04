import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";

export class TRMNL extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("TRMNL initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/trmnl/polling",
        type: "GET",
        handler: handleGetTRMNLContent,
      },
    ]);
  }
}

async function handleGetTRMNLContent(ctx: Context, next: Next) {
  ctx.status = 200;
  ctx.body = {
    text: "Example Custom TRMNL Plugin",
    author: "Mark Repka",
    collection: [
      {
        title: "Item 1",
        description: "Description 1",
      },
      {
        title: "Item 2",
        description: "Description 2",
      },
    ],
  };
  return next();
}
