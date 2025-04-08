import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { SupabaseClient } from "@supabase/supabase-js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateAuth } from "./utils/validation";
import { returnBadRequest, returnUnauthorized } from "./utils/response";

export async function createMCPServer(
  supabase: SupabaseClient,
  router: KoaRouter
): Promise<McpServer> {
  const server = new McpServer({
    name: "repka-lifeforce",
    version: "1.0.0",
  });

  router.get("/api/mcp", async (ctx: Context, next: Next) => {
    const auth = await validateAuth(supabase, ctx);
    if (!auth) {
      return returnUnauthorized(ctx, next);
    }

    const transport = new SSEServerTransport("/api/mcp", ctx.res);
    ServerTransports.register(transport.sessionId, {
      transport,
      sessionId: transport.sessionId,
    });

    transport.onclose = () => {
      console.log(`Transport closed for sessionId: ${transport.sessionId}`);
      ServerTransports.unregister(transport.sessionId);
    };

    transport.onerror = (error) => {
      console.error(
        `Transport error for sessionId: ${transport.sessionId}`,
        error
      );
    };

    ctx.respond = false; // Prevent Koa from automatically responding
    return server.connect(transport);
  });

  router.post("/api/mcp", async (ctx: Context, next: Next) => {
    const { req, res } = ctx;

    const sessionId = ctx.query.sessionId as string;
    if (!sessionId) {
      return returnBadRequest(ctx, next);
    }

    const connection = ServerTransports.get(sessionId);
    if (!connection) {
      return returnBadRequest(ctx, next);
    }

    ctx.respond = false; // Prevent Koa from automatically responding
    return connection.transport.handlePostMessage(req, res, ctx.request.body);
  });

  return server;
}

type SSEConnection = {
  transport: SSEServerTransport;
  sessionId: string;
};

class ServerTransports {
  private static _transports = new Map<string, SSEConnection>();

  public static register(sessionId: string, transport: SSEConnection): void {
    console.log(`Registering transport for sessionId: ${sessionId}`);
    this._transports.set(sessionId, transport);
  }

  public static unregister(sessionId: string): void {
    console.log(`Unregistering transport for sessionId: ${sessionId}`);
    this._transports.delete(sessionId);
  }

  public static get(sessionId: string): SSEConnection | undefined {
    return this._transports.get(sessionId);
  }
}
