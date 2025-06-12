/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { validateStaticAuth } from "../utils/validation";
import {
  returnBadRequest,
  returnSuccess,
  returnUnauthorized,
} from "../utils/response";
import { randomUUID } from "node:crypto";
import { HennosOpenAIProvider } from "../hennos/openai";

export class HennosLite extends LifeforcePlugin {
  private static sessions = new Map<string, HennosLiteSession>();

  public async init(): Promise<void> {
    Logger.info("HennosLite initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.addHandlers([
      {
        path: "/api/hennos-lite/session",
        type: "POST",
        handler: this.handleCreateHennosLiteSession.bind(this),
        auth: true,
      },
      {
        path: "/api/hennos-lite/session/:sessionId",
        type: "POST",
        handler: this.handleUpdateHennosLiteSession.bind(this),
        auth: true,
      },
      {
        path: "/api/hennos-lite/session/:sessionId",
        type: "GET",
        handler: this.handleGetHennosLiteSession.bind(this),
        auth: true,
      },
    ]);
  }

  private async handleUpdateHennosLiteSession(ctx: Context, next: Next) {
    const hasValidStaticAuth = await validateStaticAuth(ctx);
    if (!hasValidStaticAuth) {
      return returnUnauthorized(ctx, next);
    }

    const sessionId = ctx.params.sessionId;
    if (!sessionId || !HennosLite.sessions.has(sessionId)) {
      return returnBadRequest(ctx, next);
    }

    const body = ctx.request.body as { content: string };
    if (!body || !body.content) {
      return returnBadRequest(ctx, next);
    }

    const validSession = HennosLite.sessions.has(sessionId);
    if (!validSession) {
      return returnBadRequest(ctx, next);
    }

    const message: HennosLiteMessage = {
      role: "user",
      content: body.content,
      messageId: randomUUID(),
      createdAt: new Date(),
    };

    Logger.info(`Updated HennosLite session: ${sessionId}`);

    const assistantMessageId = randomUUID();
    setImmediate(() => {
      Logger.info(
        `Kicking off assistant response for session: ${sessionId} with message ID: ${assistantMessageId} responding to user message ID: ${message.messageId}`
      );

      const openai = new HennosOpenAIProvider();
      openai
        .completion(sessionId, {
          role: "user",
          content: body.content,
        })
        .then((response) => {
          const session = HennosLite.sessions.get(sessionId);
          if (!session) {
            Logger.error(
              `Session not found for sessionId: ${sessionId} while processing assistant response`
            );
            return;
          }

          session.history.push(message);
          const assistantMessage: HennosLiteMessage = {
            role: "assistant",
            content: response,
            messageId: assistantMessageId,
            createdAt: new Date(),
          };

          session.history.push(assistantMessage);
          session.updatedAt = new Date();

          Logger.info(
            `Assistant response added to session: ${sessionId} with message ID: ${assistantMessageId}`
          );
        })
        .catch((error) => {
          Logger.error(
            `Error processing assistant response for session: ${sessionId} - ${error}`
          );
        });
    });

    return returnSuccess(
      false,
      {
        sessionId: sessionId,
        messageId: message.messageId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        responseId: assistantMessageId,
      },
      ctx,
      next
    );
  }

  private async handleGetHennosLiteSession(ctx: Context, next: Next) {
    const hasValidStaticAuth = await validateStaticAuth(ctx);
    if (!hasValidStaticAuth) {
      return returnUnauthorized(ctx, next);
    }

    const sessionId = ctx.params.sessionId;
    if (!sessionId || !HennosLite.sessions.has(sessionId)) {
      return returnBadRequest(ctx, next);
    }

    const session = HennosLite.sessions.get(sessionId);
    if (!session) {
      return returnBadRequest(ctx, next);
    }

    Logger.info(`Retrieved HennosLite session: ${sessionId}`);
    return returnSuccess(false, session.toPayload(), ctx, next);
  }

  private async handleCreateHennosLiteSession(ctx: Context, next: Next) {
    const hasValidStaticAuth = await validateStaticAuth(ctx);
    if (!hasValidStaticAuth) {
      return returnUnauthorized(ctx, next);
    }

    const body = ctx.request.body as { name: string; lat: number; lng: number };
    if (
      !body ||
      !body.name ||
      typeof body.lat !== "number" ||
      typeof body.lng !== "number"
    ) {
      return returnBadRequest(ctx, next);
    }

    const session = new HennosLiteSession(body.name, body.lat, body.lng);
    HennosLite.sessions.set(session.sessionId, session);
    Logger.info(`Created new HennosLite session: ${session.sessionId}`);
    return returnSuccess(false, session.toPayload(), ctx, next);
  }
}

type HennosLiteMessage = {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  createdAt: Date;
};

class HennosLiteSession {
  public sessionId: string;
  public updatedAt: Date;

  private name: string;
  private lat: number;
  private lng: number;
  private createdAt: Date;

  public history: HennosLiteMessage[] = [];

  constructor(name: string, lat: number, lng: number) {
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.sessionId = randomUUID();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public toPayload() {
    return {
      sessionId: this.sessionId,
      name: this.name,
      lat: this.lat,
      lng: this.lng,
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      history: this.history.map((msg) => ({
        role: msg.role,
        content: msg.content,
        messageId: msg.messageId,
        createdAt: msg.createdAt.toISOString(),
      })),
    };
  }
}
