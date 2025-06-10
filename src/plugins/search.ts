import { z } from "zod";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import axios from "axios";
import { Logger } from "../utils/logger";

export class SearXNG extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("SearXNG initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.mcp.tool(
      "web-search",
      "Fetch a list of search reqults for a provided search query",
      { query: z.string() },
      async ({ query }) => {
        const result = await searxng(query);
        return {
          content: [{ type: "text", text: JSON.stringify(result.data) }],
        };
      }
    );
  }
}

async function searxng(query: string) {
  return axios.get(
    `https://search.repkam09.com/search?format=json&q=${encodeURI(query)}`
  );
}
