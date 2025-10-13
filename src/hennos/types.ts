import { Logger } from "../utils/logger";

export type HennosBaseMessage = {
  __type: string;
  value: unknown;
};

export function isHennosMessage(message: object): message is HennosBaseMessage {
  if (!Object.prototype.hasOwnProperty.call(message, "__type")) {
    Logger.error("Message is missing __type property");
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(message, "value")) {
    Logger.error("Message is missing value property");
    return false;
  }

  return true;
}

export type HennosMessage =
  | HennosErrorMessage
  | HennosUserMessage
  | HennosAssistantMessage
  | HennosMetadataMessage
  | HennosKeepAliveMessage;

export type HennosErrorMessage = {
  __type: "error";
  value: string;
};

export type HennosUserMessage = {
  __type: "user-msg";
  value: string;
};

export type HennosAssistantMessage = {
  __type: "assistant-msg";
  value: string;
};

export type HennosMetadataMessage = {
  __type: "metadata-msg";
  value: string;
};

export type HennosKeepAliveMessage = {
  __type: "keep-alive";
  value: null;
};
