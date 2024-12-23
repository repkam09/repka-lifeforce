import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { hasValidAuth } from "../utils/common";
import WebSocket from "ws";
import { Config } from "../utils/config";
import { v4 } from "uuid";

type InFlightRequest = {
  requestId: string;
  resolve: (value: any) => any;
};

export class Hennos extends LifeforcePlugin {
  private socket!: WebSocket;
  private requests: InFlightRequest[] = [];
  private connected = false;

  public async init(): Promise<void> {
    Logger.info("Hennos initialized");
    if (Config.WS_SERVER_ENABLED) {
      this.reconnect();
      setInterval(() => {
        if (!this.connected) {
          this.reconnect();
        }
      }, 5000);
    }
  }

  private reconnect() {
    this.socket = new WebSocket(
      `ws://${Config.WS_SERVER_HOST}:${Config.WS_SERVER_PORT}`
    );

    this.socket.on("error", (err) => {
      const error = err as Error;
      Logger.error(`Error connecting to WebSocket server: ${error.message}`);
      this.connected = false;
    });

    this.socket.on("open", () => {
      Logger.info("Connected to WebSocket server");
      this.connected = true;
    });

    this.socket.on("message", this.handleAsyncMessageResponse.bind(this));

    this.socket.on("close", () => {
      Logger.info("Disconnected from WebSocket server");
      this.connected = false;
    });
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/hennos/chat/:chatId",
        type: "GET",
        handler: this.handleGetChatContext.bind(this),
      },
      {
        path: "/api/hennos/chat/:chatId",
        type: "POST",
        handler: this.handleUpdateChatContext.bind(this),
      },
      {
        path: "/api/hennos/users",
        type: "GET",
        handler: this.handleGetUsersList.bind(this),
      },
    ]);
  }

  private async handleAsyncMessageResponse(data: any) {
    try {
      const message = JSON.parse(data);
      if (!message.requestId) {
        Logger.error("Received message without requestId");
        return;
      }

      Logger.debug(`Received async message response for ${message.requestId}`);
      const request = this.requests.find(
        (r) => r.requestId === message.requestId
      );

      if (request) {
        Logger.debug(`Found request for message ${message.requestId}`);
        return request.resolve(message);
      }

      Logger.error(`Could not find request for message ${message.requestId}`);
    } catch (err) {
      Logger.error(`Error handling async message response: ${err}`);
    }
  }

  private async handleGetUsersList(ctx: Context, next: Next) {
    if (!hasValidAuth(ctx)) {
      ctx.status = 401;
      ctx.body = "Unauthorized";

      return next();
    }

    const requestId = v4();

    const AsyncRequest = new Promise((resolve) => {
      this.requests.push({ requestId, resolve });
    });

    Logger.debug(`Sending request ${requestId} to WS server`);
    this.socket.send(
      JSON.stringify({
        requestId,
        auth: Config.WS_SERVER_TOKEN,
        __type: "users",
      })
    );

    const response: any = await AsyncRequest;
    Logger.debug(`Received response for request ${requestId}`);

    ctx.status = 200;
    ctx.body = response.payload;

    return next();
  }

  private async handleGetChatContext(ctx: Context, next: Next) {
    if (!hasValidAuth(ctx)) {
      ctx.status = 401;
      ctx.body = "Unauthorized";

      return next();
    }

    if (!ctx.params.chatId) {
      ctx.status = 400;
      ctx.body = "Bad Request";

      return next();
    }

    Logger.debug(`Looking up chat context for ${ctx.params.chatId}`);

    // validate that chatId is a valid number
    const chatId = parseInt(ctx.params.chatId, 10);
    if (isNaN(chatId)) {
      ctx.status = 400;
      ctx.body = "Bad Request";
      return next();
    }

    const requestId = v4();

    const AsyncRequest = new Promise((resolve) => {
      this.requests.push({ requestId, resolve });
    });

    Logger.debug(`Sending request ${requestId} to WS server`);
    this.socket.send(
      JSON.stringify({
        requestId,
        auth: Config.WS_SERVER_TOKEN,
        chatId: chatId,
        __type: "context",
      })
    );

    const response: any = await AsyncRequest;
    Logger.debug(`Received response for request ${requestId}`);

    ctx.status = 200;
    ctx.body = response.payload;

    return next();
  }

  private async handleUpdateChatContext(ctx: Context, next: Next) {
    if (!hasValidAuth(ctx)) {
      ctx.status = 401;
      ctx.body = "Unauthorized";

      return next();
    }

    if (!ctx.params.chatId) {
      ctx.status = 400;
      ctx.body = "Bad Request";

      return next();
    }

    if (!ctx.request.body) {
      ctx.status = 400;
      ctx.body = "Bad Request";

      return next();
    }

    // make sure that the body is an object and has a property called content
    // @ts-expect-error - TS doesn't know that ctx.request.body is an object
    if (typeof ctx.request.body !== "object" || !ctx.request.body.content) {
      ctx.status = 400;
      ctx.body = "Bad Request";

      return next();
    }

    Logger.debug(`Looking up chat context for ${ctx.params.chatId}`);

    // validate that chatId is a valid number
    const chatId = parseInt(ctx.params.chatId, 10);
    if (isNaN(chatId)) {
      ctx.status = 400;
      ctx.body = "Bad Request";
      return next();
    }

    const requestId = v4();

    const AsyncRequest = new Promise((resolve) => {
      this.requests.push({ requestId, resolve });
    });

    Logger.debug(`Sending request ${requestId} to WS server`);
    this.socket.send(
      JSON.stringify({
        requestId,
        auth: Config.WS_SERVER_TOKEN,
        chatId: chatId,
        // @ts-expect-error - TS doesn't know that ctx.request.body is an object
        content: ctx.request.body.content,
        __type: "completion",
      })
    );

    const response: any = await AsyncRequest;
    Logger.debug(`Received response for request ${requestId}`);

    ctx.status = 200;
    ctx.body = response.payload;

    return next();
  }
}
