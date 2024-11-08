export class Logger {
  static info(message: string) {
    console.log(`INFO: ${message}`);
  }

  static debug(message: string) {
    console.log(`DEBUG: ${message}`);
  }

  static warn(message: string) {
    console.warn(`WARN: ${message}`);
  }

  static error(message: string) {
    console.error(`ERROR: ${message}`);
  }

  static verbose(message: string) {
    console.log(`VERBOSE: ${message}`);
  }
}
