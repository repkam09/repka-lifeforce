/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import { Context, Next } from "koa";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";

import { Config } from "../utils/config";
import {
  returnBadRequest,
  returnSuccess,
  returnUnauthorized,
} from "../utils/response";
import { validateStaticAuth } from "../utils/validation";
import { createTemporalClient } from "../utils/temporal";
import {
  Workflow,
  WorkflowHandleWithFirstExecutionRunId,
} from "@temporalio/client";

type MessageLite = {
  role: "user" | "assistant" | "system";
  content: string;
};

export class OllamaWrapper extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Hennos initialized");
  }

  private pendingChats = new Map<
    string,
    WorkflowHandleWithFirstExecutionRunId<Workflow>
  >();

  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.addHandlers([
      {
        path: "/api/llm/chat",
        type: "POST",
        handler: this.handleChatCreate.bind(this),
      },
      {
        path: "/api/llm/chat/:uuid",
        type: "GET",
        handler: this.handleChatGetById.bind(this),
      },
    ]);
  }

  private async handleChatCreate(ctx: Context, next: Next) {
    const user = await validateStaticAuth(ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }

    const body = ctx.request.body as {
      messages?: MessageLite[];
    };

    if (!body || !body.messages) {
      return returnBadRequest(ctx, next);
    }

    const requestId = randomUUID();
    const client = await createTemporalClient();
    const handle = await client.workflow.start("hennos-lite", {
      taskQueue: Config.TEMPORAL_TASK_QUEUE,
      args: [{ requestId, messages: body.messages }],
      workflowId: `hennos-lite-${requestId}`,
    });

    this.pendingChats.set(requestId, handle);

    return returnSuccess(false, { uuid: requestId }, ctx, next);
  }

  private async handleChatGetById(ctx: Context, next: Next) {
    const user = await validateStaticAuth(ctx);
    if (!user) {
      return returnUnauthorized(ctx, next);
    }

    const { uuid } = ctx.params as { uuid: string };
    if (!uuid) {
      return returnBadRequest(ctx, next);
    }

    const handle = this.pendingChats.get(uuid);
    if (!handle) {
      return returnBadRequest(ctx, next);
    }

    // Check if the workflow is still running
    const desc = await handle.describe();
    if (desc.status.name !== "COMPLETED") {
      return returnSuccess(false, { status: desc.status.name }, ctx, next);
    }

    const result = await handle.result();

    setTimeout(() => {
      this.pendingChats.delete(uuid);
    }, 1 * 60 * 1000); // Clean up after 1 minute

    return returnSuccess(false, result, ctx, next);
  }
}
