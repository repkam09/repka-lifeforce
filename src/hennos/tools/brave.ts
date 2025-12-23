import { RealtimeFunctionTool } from "openai/resources/realtime/realtime";
import { WebSocket } from "ws";
import { Config } from "../../utils/config";
import { Logger } from "../../utils/logger";

export class BraveSearch {
  private static readonly RESULTS_COUNT = 10;

  public static definition(): RealtimeFunctionTool {
    return {
      type: "function",
      name: "brave_search",
      description:
        "Use Brave Search to get up-to-date information from the web to help answer user queries.",
      parameters: {
        type: "object",
        properties: {
          resource: {
            type: "string",
            enum: ["web", "images", "news", "videos"],
            description:
              "The type of search results to return. The default is 'web'.",
          },
          query: {
            type: "string",
            description: "The search query to send to the Brave Search API.",
          },
        },
        required: ["query"],
      },
    };
  }

  public static async callback(
    socket: WebSocket,
    callId: string,
    args: Record<string, string>
  ): Promise<void> {
    Logger.info(
      `Brave callback, query=${args.query}, resource=${args.resource}`
    );
    if (!args.query) {
      return BraveSearch.sendResult(socket, callId, {
        error: "brave_search, missing required parameter 'query'",
      });
    }

    const resource = args.resource || "web";
    if (!["web", "images", "news", "videos"].includes(resource)) {
      return BraveSearch.sendResult(socket, callId, {
        error: `brave_search, invalid resource '${resource}' provided. Expected one of: web, images, news, videos`,
      });
    }

    try {
      const body = await BraveSearch.searchResults({
        query: args.query,
        resource: resource,
      });
      return BraveSearch.sendResult(socket, callId, { results: body });
    } catch (err: unknown) {
      const error = err as Error;
      Logger.error(`Error fetching Brave search results: ${error.message}`);
      return BraveSearch.sendResult(socket, callId, {
        error: `brave_search, failed to fetch search results: ${error.message}`,
      });
    }
  }

  private static sendResult(
    socket: WebSocket,
    callId: string,
    body: object
  ): void {
    socket.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(body),
        },
      })
    );
    socket.send(
      JSON.stringify({
        type: "response.create",
      })
    );
  }

  private static async searchResults(args: {
    query: string;
    resource: string;
  }): Promise<Array<object>> {
    let params = new URLSearchParams();

    switch (args.resource) {
      case "images":
        params = new URLSearchParams({
          q: args.query,
          safesearch: "off",
          count: `${BraveSearch.RESULTS_COUNT}`,
        });
        break;
      case "news":
        params = new URLSearchParams({
          q: args.query,
          safesearch: "off",
          count: `${BraveSearch.RESULTS_COUNT}`,
        });
        break;
      case "videos":
        params = new URLSearchParams({
          q: args.query,
          count: `${BraveSearch.RESULTS_COUNT}`,
        });
        break;
      default:
        params = new URLSearchParams({
          q: args.query,
          count: `${BraveSearch.RESULTS_COUNT}`,
          safesearch: "off",
          extra_snippets: "true",
          summary: "true",
        });
        break;
    }

    const response = await fetch(
      `https://api.search.brave.com/res/v1/${args.resource}/search?${params}`,
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
}
