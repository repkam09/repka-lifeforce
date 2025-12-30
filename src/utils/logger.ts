import pino from "pino";
import { Config } from "./config";
import { randomUUID } from "node:crypto";

export class Logger {
  private static instance: string = randomUUID();

  public static get logger() {
    if (Config.AXIOM_API_KEY && Config.AXIOM_DATASET) {
      return pino({
        level: "debug",
        transport: {
          target: "@axiomhq/pino",
          options: {
            dataset: Config.AXIOM_DATASET,
            token: Config.AXIOM_API_KEY,
          },
        },
      });
    }

    // Fallback to console logging
    return pino({
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
          ignore: "pid,hostname,instance,consumer",
          errorLikeObjectKeys: ["err", "error", "cause", "reason"],
          sync: true,
        },
      },
    });
  }

  static info(message: string) {
    Logger.logger.info(
      {
        consumer: "lifeforce",
        instance: Logger.instance,
      },
      message
    );
  }

  static debug(message: string) {
    Logger.logger.debug(
      {
        consumer: "lifeforce",
        instance: Logger.instance,
      },
      message
    );
  }

  static warn(message: string) {
    Logger.logger.warn(
      {
        consumer: "lifeforce",
        instance: Logger.instance,
      },
      message
    );
  }

  static error(message: string) {
    Logger.logger.error(
      {
        consumer: "lifeforce",
        instance: Logger.instance,
      },
      message
    );
  }

  static verbose(message: string) {
    if (Config.LIFEFORCE_DEBUG_MODE) {
      Logger.logger.debug(
        {
          consumer: "lifeforce",
          instance: Logger.instance,
        },
        message
      );
    }
  }
}
