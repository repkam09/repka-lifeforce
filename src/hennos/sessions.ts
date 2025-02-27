import { WebSocket } from "ws";
import { Logger } from "../utils/logger";
import { HennosMessage } from "./types";

type HennosSession = {
  userId: string;
  socketId: string;
  socket: WebSocket;
};

type HennosUserId = string;

export class HennosSessionHandler {
  private static sessions: Map<HennosUserId, HennosSession[]> = new Map();

  public static register(
    userId: string,
    socketId: string,
    socket: WebSocket
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
      session.socket.close();
    } catch (e) {
      Logger.error(
        `Failed to close socket ${session.socketId} for user ${session.userId}, error: ${e}`
      );
    }

    sessions.splice(index, 1);
  }

  public static broadcast(userId: string, message: HennosMessage): void {
    if (!HennosSessionHandler.sessions.has(userId)) {
      return;
    }

    const sessions = HennosSessionHandler.sessions.get(userId);
    if (!sessions) {
      return;
    }

    for (const session of sessions) {
      try {
        session.socket.send(JSON.stringify(message));
      } catch (e) {
        Logger.error(
          `Failed to send message to socket ${session.socketId} for user ${session.userId}, error: ${e}`
        );
      }
    }
  }
}
