import { z } from "zod";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";
import { Next, Context } from "koa";
import { returnSuccess, returnBadRequest } from "../utils/response";
import { createTemporalClient } from "../utils/temporal";
import { randomUUID } from "node:crypto";

export class Search extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Search Initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.addHandlers([
      {
        path: "/api/search",
        type: "POST",
        handler: this.handleSearchPost.bind(this),
      },
      {
        path: "/api/search",
        type: "GET",
        handler: this.handleSearchGet.bind(this),
      },
    ]);

    this.mcp.tool(
      "web-search-brave",
      "Fetch a list of search results for a provided search query using Brave Search API.",
      { query: z.string() },
      async ({ query }) => {
        Logger.info(`MCP Brave Search: ${query}`);
        const result = await brave(query);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      }
    );
  }

  private async handleSearchPost(ctx: Context, next: Next) {
    if (!ctx.request.body) {
      return returnBadRequest(ctx, next);
    }

    const body = ctx.request.body as { query?: string };
    if (!body.query) {
      return returnBadRequest(ctx, next);
    }

    const client = await createTemporalClient();
    const handle = await client.workflow.start("searchWorkflow", {
      taskQueue: Config.TEMPORAL_TASK_QUEUE,
      args: [
        {
          query: body.query,
        },
      ],
      workflowId: `search-${randomUUID()}`,
    });

    const results = await handle.result();
    return returnSuccess(false, results, ctx, next);
  }

  private async handleSearchGet(ctx: Context, next: Next) {
    const query = ctx.request.query.q as string;
    if (!query) {
      return returnBadRequest(ctx, next);
    }

    const client = await createTemporalClient();
    const handle = await client.workflow.start("searchWorkflow", {
      taskQueue: Config.TEMPORAL_TASK_QUEUE,
      args: [
        {
          query: query,
        },
      ],
      workflowId: `search-${randomUUID()}`,
    });

    const results = await handle.result();
    return returnSuccess(false, results, ctx, next);
  }
}

async function brave(query: string) {
  const params = new URLSearchParams({
    q: query,
    count: "10",
    safesearch: "off",
    extra_snippets: "true",
    summary: "true",
  });
  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "x-subscription-token": Config.BRAVE_SEARCH_API_KEY as string,
      },
    }
  );
  const body = await response.json();
  return body;
}
