/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "transmission" {
  interface TransmissionOptions {
    port: number;
    host: string;
    username?: string;
    password?: string;
  }

  interface AddUrlCallback {
    (err: Error | null, result: any): void;
  }

  interface AddFileCallback {
    (err: Error | null, result: any): void;
  }

  class Transmission {
    constructor(options: TransmissionOptions);

    addUrl(url: string, options: object, callback: AddUrlCallback): void;
    addFile(filePath: string, options: object, callback: AddFileCallback): void;
  }

  export = Transmission;
}
