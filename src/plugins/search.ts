import { z } from "zod";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";

export class SearXNG extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Search initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.mcp.tool(
      "web-search-searxng",
      "Fetch a list of search results for a provided search query using SearXNG API, a privacy-respecting search engine.",
      { query: z.string() },
      async ({ query }) => {
        Logger.info(`MCP SearXNG Search: ${query}`);
        const result = await searxng(query);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      }
    );

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
}

async function searxng(query: string) {
  const params = new URLSearchParams({
    format: "json",
    q: query,
  });

  const response = await fetch(`https://search.repkam09.com/search?${params}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
    },
  });

  return response.json();
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
