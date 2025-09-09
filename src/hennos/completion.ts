import { Logger } from "../utils/logger";
import { HennosSessionHandler } from "./sessions";
import { isHennosMessage } from "./types";
import { Config } from "../utils/config";
import { createTemporalClient } from "../utils/temporal";

export async function handleUserMessage(
  userId: string,
  message: object
): Promise<void> {
  if (!isHennosMessage(message)) {
    Logger.debug(`HennosUser ${userId} sent invalid object message`);
    return;
  }

  switch (message.__type) {
    case "user-msg": {
      const client = await createTemporalClient();
      Logger.debug(
        `Starting hennos-chat workflow for user ${userId} with message: ${message.value}`
      );
      const handle = await client.workflow.start("hennos-chat", {
        taskQueue: Config.TEMPORAL_TASK_QUEUE,
        args: [
          {
            userId,
            message: message.value,
          },
        ],
        workflowId: `hennos-chat-${userId}-${Date.now()}`,
      });

      const result: string = await handle.result();
      HennosSessionHandler.broadcast(userId, {
        __type: "assistant-msg",
        value: result,
      });
      break;
    }

    default: {
      Logger.debug(
        `HennosUser ${userId} sent message: ${JSON.stringify(message)}`
      );
    }
  }
}
