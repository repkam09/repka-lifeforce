import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { SupabaseClient } from "@supabase/supabase-js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateStaticAuth } from "./utils/validation";
import { returnBadRequest, returnUnauthorized } from "./utils/response";
import { Logger } from "./utils/logger";
import { randomUUID } from "crypto";

export async function createMCPServer(
  supabase: SupabaseClient,
  router: KoaRouter
): Promise<McpServer> {
  const server = new McpServer({
    name: "repka-lifeforce",
    version: "1.1.0",
  });

  router.post("/api/mcp/stream", async (ctx: Context, next: Next) => {
    let transport: StreamableHTTPServerTransport;

    // Check if this is an existing session trying to reconnect
    const sessionId = ctx.req.headers["mcp-session-id"] as string | undefined;
    if (ServerTransports.has(sessionId)) {
      const connection = ServerTransports.get(sessionId) as StreamConnection;
      transport = connection.transport;
    } else if (isInitializeRequest(ctx.request.body)) {
      // New connection, validate auth
      const auth = await validateStaticAuth(ctx);
      if (!auth) {
        return returnUnauthorized(ctx, next);
      }

      // Create a new transport
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (_sessionId: string) => {
          ServerTransports.register(_sessionId, {
            __type: "stream",
            transport,
            sessionId: _sessionId,
          });
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          Logger.info(
            `Stream connection closed for sessionId: ${transport.sessionId}`
          );
          ServerTransports.unregister(transport.sessionId);
        }
      };

      ctx.respond = false; // Prevent Koa from automatically responding
      await server.connect(transport);
    } else {
      // Invalid request, neither a valid session nor an init request
      return returnBadRequest(ctx, next);
    }

    return transport.handleRequest(ctx.req, ctx.res, ctx.request.body);
  });

  router.get("/api/mcp", async (ctx: Context, next: Next) => {
    const auth = await validateStaticAuth(ctx);
    if (!auth) {
      return returnUnauthorized(ctx, next);
    }

    const transport = new SSEServerTransport("/api/mcp", ctx.res);
    ServerTransports.register(transport.sessionId, {
      __type: "sse",
      transport,
      sessionId: transport.sessionId,
    });

    transport.onclose = () => {
      ServerTransports.unregister(transport.sessionId);
    };

    transport.onerror = (error) => {
      Logger.error(
        `Transport error for sessionId: ${transport.sessionId}: ${error.message}`
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

    const connection = ServerTransports.get(sessionId) as
      | SSEConnection
      | undefined;
    if (!connection) {
      return returnBadRequest(ctx, next);
    }

    Logger.info(`Handling POST message for sessionId: ${sessionId}`);
    Logger.info(`Request body: ${JSON.stringify(ctx.request.body)}`);

    ctx.respond = false; // Prevent Koa from automatically responding
    return connection.transport.handlePostMessage(req, res, ctx.request.body);
  });

  return server;
}

type SSEConnection = {
  __type: "sse";
  transport: SSEServerTransport;
  sessionId: string;
};

type StreamConnection = {
  __type: "stream";
  transport: StreamableHTTPServerTransport;
  sessionId: string;
};

class ServerTransports {
  private static _sse_transports = new Map<string, SSEConnection>();
  private static _stream_transports = new Map<string, StreamConnection>();

  public static register(
    sessionId: string,
    transport: SSEConnection | StreamConnection
  ): void {
    if (transport.__type === "sse") {
      Logger.info(
        `Registering transport for SSE transport, sessionId: ${sessionId}`
      );
      this._sse_transports.set(sessionId, transport);
      return;
    }

    if (transport.__type === "stream") {
      Logger.info(
        `Registering transport for Stream transport, sessionId: ${sessionId}`
      );
      this._stream_transports.set(sessionId, transport);
      return;
    }

    throw new Error("Unknown transport type");
  }

  public static unregister(sessionId: string): void {
    Logger.info(`Unregistering transport for sessionId: ${sessionId}`);
    // We'll just try to delete from both maps, trust the UUID doesnt overlap.
    this._sse_transports.delete(sessionId);
    this._stream_transports.delete(sessionId);
  }

  public static get(
    sessionId: string
  ): SSEConnection | StreamConnection | undefined {
    return (
      this._sse_transports.get(sessionId) ||
      this._stream_transports.get(sessionId)
    );
  }

  public static has(sessionId: string | undefined): sessionId is string {
    if (!sessionId) return false;
    return (
      this._sse_transports.has(sessionId) ||
      this._stream_transports.has(sessionId)
    );
  }
}
