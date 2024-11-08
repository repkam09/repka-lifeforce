import { IncomingMessage } from "http";

export function getClientIP(req: IncomingMessage): string {
  let ip = "0.0.0.0";
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"] as string;
  } else if (req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  return ip;
}
