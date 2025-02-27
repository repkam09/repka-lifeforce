import { Logger } from "../utils/logger";
import { HennosOpenAIProvider } from "./openai";
import { HennosSessionHandler } from "./sessions";
import { HennosStorageHandler } from "./storage";
import { HennosUserMessage, isHennosMessage } from "./types";

export function handleUserMessage(userId: string, message: object): void {
  if (!isHennosMessage(message)) {
    Logger.debug(`HennosUser ${userId} sent invalid object message`);
    return;
  }

  switch (message.__type) {
    case "user-msg": {
      handleUserChatMessage(userId, message as HennosUserMessage);
      break;
    }

    case "keep-alive": {
      break;
    }

    case "metadata-msg": {
      Logger.debug(`HennosUser ${userId} sent metadata message`);
      break;
    }

    case "error": {
      Logger.debug(`HennosUser ${userId} sent error message`);
      break;
    }

    default: {
      Logger.debug(
        `HennosUser ${userId} sent unknown message type: ${message.__type}`
      );
    }
  }
}

async function handleUserChatMessage(
  userId: string,
  message: HennosUserMessage
): Promise<void> {
  Logger.debug(`HennosUser ${userId} sent chat message: ${message.value}`);
  const openai = new HennosOpenAIProvider();
  const result = await openai.completion(userId, {
    role: "user",
    content: message.value,
  });

  HennosStorageHandler.append(userId, {
    role: "user",
    content: message.value,
  });

  HennosStorageHandler.append(userId, {
    role: "assistant",
    content: result,
  });

  HennosSessionHandler.broadcast(userId, {
    __type: "assistant-msg",
    value: result,
  });
}
