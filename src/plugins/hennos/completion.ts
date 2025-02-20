import { Logger } from "../../utils/logger";
import { HennosOpenAIProvider } from "./openai";
import { HennosMessage } from "./types";

export function handleHennosMessage(
  chatId: string,
  input: HennosMessage,
  cb: (input: HennosMessage) => void
) {
  switch (input.__type) {
    case "user-msg": {
      return handleHennosUserMessage(chatId, input.value, cb);
    }

    case "keep-alive": {
      break;
    }

    default: {
      Logger.warn(`Unknown Hennos message type: ${input.__type}`);
    }
  }
}

async function handleHennosUserMessage(
  chatId: string,
  message: string,
  cb: (input: HennosMessage) => void
) {
  const openai = new HennosOpenAIProvider();
  const result = await openai.completion(chatId, {
    role: "user",
    content: message,
  });

  cb({
    __type: "assistant-msg",
    value: result,
  });
}
