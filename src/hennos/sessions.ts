import { WebSocket } from "ws";
import { Logger } from "../utils/logger";
import { HennosMessage } from "./types";
import { PassThrough } from "node:stream";
import { Config } from "../utils/config";

type HennosSession = {
  userId: string;
  socketId: string;
  socket: PassThrough;
};

type HennosUserId = string;

export class HennosSessionHandler {
  private static sessions: Map<HennosUserId, HennosSession[]> = new Map();

  public static register(
    userId: string,
    socketId: string,
    socket: PassThrough
  ): void {
    if (!HennosSessionHandler.sessions.has(userId)) {
      HennosSessionHandler.sessions.set(userId, []);
    }

    const session = HennosSessionHandler.sessions.get(userId);
    if (!session) {
      throw new Error(`Session map not found for user ${userId}`);
    }

    session.push({ userId, socketId, socket });
  }

  public static unregister(userId: string, socketId: string): void {
    if (!HennosSessionHandler.sessions.has(userId)) {
      return;
    }

    const sessions = HennosSessionHandler.sessions.get(userId);
    if (!sessions) {
      return;
    }

    const index = sessions.findIndex((s) => s.socketId === socketId);
    if (index === -1) {
      return;
    }

    const session = sessions[index];
    try {
      session.socket.end();
    } catch (e) {
      Logger.error(
        `Failed to close socket ${session.socketId} for user ${session.userId}, error: ${e}`
      );
    }

    sessions.splice(index, 1);
  }

  public static broadcast(userId: string, message: HennosMessage): void {
    if (!HennosSessionHandler.sessions.has(userId)) {
      Logger.error(`No sessions found for user ${userId}`);
      return;
    }

    const sessions = HennosSessionHandler.sessions.get(userId);
    if (!sessions) {
      Logger.error(`Session map is undefined for user ${userId}`);
      return;
    }

    Logger.info(
      `Broadcasting message to ${sessions.length} sessions for user ${userId}`
    );
    for (const session of sessions) {
      try {
        session.socket.write(`data: ${JSON.stringify(message)}\n\n`);
      } catch (e) {
        Logger.error(
          `Failed to send message to socket ${session.socketId} for user ${session.userId}, error: ${e}`
        );
      }
    }
  }
}

export class HennosRealtimeSessionHandler {
  private static sessions: Map<HennosUserId, HennosSession[]> = new Map();
  private static websockets: Map<HennosUserId, WebSocket> = new Map();

  public static register(
    userId: string,
    socketId: string,
    socket: PassThrough
  ): void {
    if (!HennosRealtimeSessionHandler.sessions.has(userId)) {
      HennosRealtimeSessionHandler.sessions.set(userId, []);
    }

    const session = HennosRealtimeSessionHandler.sessions.get(userId);
    if (!session) {
      throw new Error(`Session map not found for user ${userId}`);
    }

    if (!HennosRealtimeSessionHandler.websockets.has(userId)) {
      const url =
        "wss://api.openai.com/v1/realtime?model=" + Config.OPENAI_LLM_REALTIME;
      const ws = new WebSocket(url, {
        headers: {
          Authorization: "Bearer " + Config.OPENAI_API_KEY,
          "OpenAI-Beta": "realtime=v1",
        },
      });
      HennosRealtimeSessionHandler.websockets.set(userId, ws);

      ws.on("open", function open() {
        Logger.info(`Connected to OpenAI Realtime for userId: ${userId}`);
      });

      ws.on("message", function incoming(message) {
        Logger.debug(
          `Received message from OpenAI Realtime for userId: ${userId}: ${message}`
        );
      });
    }

    session.push({ userId, socketId, socket });
  }

  public static unregister(userId: string, socketId: string): void {
    if (!HennosRealtimeSessionHandler.sessions.has(userId)) {
      return;
    }

    const sessions = HennosRealtimeSessionHandler.sessions.get(userId);
    if (!sessions) {
      return;
    }

    const index = sessions.findIndex((s) => s.socketId === socketId);
    if (index === -1) {
      return;
    }

    const session = sessions[index];
    try {
      session.socket.end();
    } catch (e) {
      Logger.error(
        `Failed to close socket ${session.socketId} for user ${session.userId}, error: ${e}`
      );
    }

    // If this is the last session for the user, close the websocket connection
    if (sessions.length === 1) {
      const websocket = HennosRealtimeSessionHandler.websockets.get(userId);
      if (websocket) {
        websocket.close();
        HennosRealtimeSessionHandler.websockets.delete(userId);

        Logger.verbose(
          `Closed realtime websocket connection for user ${userId}.`
        );
      }
    }

    // Remove the session from the list
    sessions.splice(index, 1);
  }

  public static broadcast(userId: string, payload: object): void {
    if (!HennosRealtimeSessionHandler.sessions.has(userId)) {
      return;
    }

    const sessions = HennosRealtimeSessionHandler.sessions.get(userId);
    if (!sessions) {
      return;
    }

    for (const session of sessions) {
      try {
        session.socket.write(
          `data: ${JSON.stringify({ realtime: true, payload })}\n\n`
        );
      } catch (e) {
        Logger.error(
          `Failed to send message to socket ${session.socketId} for user ${session.userId}, error: ${e}`
        );
      }
    }
  }

  public static event(userId: string, payload: object): void {
    if (!HennosRealtimeSessionHandler.sessions.has(userId)) {
      return;
    }

    const websocket = HennosRealtimeSessionHandler.websockets.get(userId);
    if (!websocket) {
      return;
    }

    try {
      websocket.send(JSON.stringify(payload));
    } catch (e) {
      Logger.error(
        `Failed to send message to websocket for user ${userId}, error: ${e}`
      );
    }
  }
}
