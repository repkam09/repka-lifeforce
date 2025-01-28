import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../../utils/LifeforcePlugin";
import { Logger } from "../../utils/logger";

export class Hennos extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Hennos initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/hennos/user",
        type: "POST",
        handler: this.handleCreateUser.bind(this),
      },
      {
        path: "/api/hennos/user/:userId",
        type: "GET",
        handler: this.handleGetUser.bind(this),
      },
      {
        path: "/api/hennos/user/:userId",
        type: "POST",
        handler: this.handlePostUser.bind(this),
      },
      {
        path: "/api/hennos/user/:userId/chat",
        type: "GET",
        handler: this.handleGetUserChat.bind(this),
      },
      {
        path: "/api/hennos/user/:userId/chat",
        type: "POST",
        handler: this.handlePostUserChat.bind(this),
      },
    ]);
  }

  private async handleCreateUser(ctx: Context, next: Next) {
    console.log("handleCreateUser", ctx, next);
    throw new Error("Method not implemented.");
  }

  private async handleGetUser(ctx: Context, next: Next) {
    console.log("handleGetUser", ctx, next);
    throw new Error("Method not implemented.");
  }

  private async handleGetUserChat(ctx: Context, next: Next) {
    console.log("handleGetUserChat", ctx, next);
    throw new Error("Method not implemented.");
  }

  private async handlePostUser(ctx: Context, next: Next) {
    console.log("handlePostUser", ctx, next);
    throw new Error("Method not implemented.");
  }

  private async handlePostUserChat(ctx: Context, next: Next) {
    console.log("handlePostUserChat", ctx, next);
    throw new Error("Method not implemented.");
  }
}
