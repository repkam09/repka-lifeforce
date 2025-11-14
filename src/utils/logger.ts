import { Config } from "./config";

export class Logger {
  static info(message: string) {
    console.log(`INFO: ${new Date().toISOString()} : ${message}`);
  }

  static debug(message: string) {
    console.log(`DEBUG: ${new Date().toISOString()} : ${message}`);
  }

  static warn(message: string) {
    console.warn(`WARN: ${new Date().toISOString()} : ${message}`);
  }

  static error(message: string) {
    console.error(`ERROR: ${new Date().toISOString()} : ${message}`);
  }

  static verbose(message: string) {
    if (Config.LIFEFORCE_DEBUG_MODE) {
      console.log(`VERBOSE: ${new Date().toISOString()} : ${message}`);
    }
  }
}
