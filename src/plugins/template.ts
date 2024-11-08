import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";

export class Template extends LifeforcePlugin {
  public init(): void {
    console.log("Template initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
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
