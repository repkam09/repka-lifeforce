import { Client, Connection } from "@temporalio/client";
import { Config } from "./config";
import { Logger } from "./logger";

export async function createTemporalClient() {
  Logger.info(
    `Connecting to Temporal at ${Config.TEMPORAL_HOST}:${Config.TEMPORAL_PORT} on ${Config.TEMPORAL_NAMESPACE}...`
  );
  const connection = await Connection.connect({
    address: `${Config.TEMPORAL_HOST}:${Config.TEMPORAL_PORT}`,
  });

  const client = new Client({
    connection,
    namespace: Config.TEMPORAL_NAMESPACE,
  });

  return client;
}
