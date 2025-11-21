import { Logger } from "../utils/logger";
import { HennosSessionHandler } from "./sessions";
import { isHennosMessage } from "./types";
import { Config } from "../utils/config";
import { createTemporalClient } from "../utils/temporal";
import { User } from "@supabase/supabase-js";

export async function handleUserMessage(
  user: User,
  message: object
): Promise<void> {
  if (!isHennosMessage(message)) {
    Logger.debug(`HennosUser ${user.id} sent invalid object message`);
    return;
  }

  switch (message.__type) {
    case "user-msg": {
      const client = await createTemporalClient();
      Logger.debug(
        `Signaling chat workflow for user ${user.id} with message: ${message.value}`
      );
      await client.workflow.signalWithStart("agentWorkflow", {
        taskQueue: Config.TEMPORAL_TASK_QUEUE,
        args: [
          {
            user: {
              displayName: 'User',
              isAdmin: false,
              isExperimental: false,
              isWhitelisted: true,
              provider: "openai",
              userId: {
                __typename: "HennosWorkflowUserId",
                value: user.id,
              }
            },
            aggressiveContinueAsNew: false,
          } satisfies AgentWorkflowInput,
        ],
        workflowId: `hennos-chat-${user.id}}`,
        signal: 'agentWorkflowMessage',
        signalArgs: [message.value, new Date().toISOString()]
      });
      break;
    }

    default: {
      Logger.debug(
        `HennosUser ${user.id} sent message: ${JSON.stringify(message)}`
      );
    }
  }
}

export type AgentWorkflowInput = {
  user: HennosWorkflowUser;
  aggressiveContinueAsNew: boolean;
};

export type HennosWorkflowUser = {
  userId: {
    __typename: "HennosWorkflowUserId";
    value: string;
  },
  displayName: string;
  isAdmin: boolean;
  isExperimental: boolean;
  isWhitelisted: boolean;
  provider: "openai";
}