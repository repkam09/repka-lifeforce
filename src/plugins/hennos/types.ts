export type HennosBaseMessage = {
  __type: string;
  payload: unknown;
};

export type HennosMessage =
  | HennosErrorMessage
  | HennosUserMessage
  | HennosAssistantMessage
  | HennosMetadataMessage
  | HennosKeepAliveMessage;

type HennosErrorMessage = {
  __type: "error";
  value: string;
};

export function buildErrorMessage(message: string): HennosErrorMessage {
  return { __type: "error", value: message };
}

type HennosUserMessage = {
  __type: "user-msg";
  value: string;
};

export function buildUserMessage(message: string): HennosUserMessage {
  return { __type: "user-msg", value: message };
}

type HennosAssistantMessage = {
  __type: "assistant-msg";
  value: string;
};

export function buildAssistantMessage(message: string): HennosAssistantMessage {
  return { __type: "assistant-msg", value: message };
}

type HennosMetadataMessage = {
  __type: "metadata-msg";
  value: string;
};

export function buildMetadataMessage(message: string): HennosMetadataMessage {
  return { __type: "metadata-msg", value: message };
}

type HennosKeepAliveMessage = {
  __type: "keep-alive";
  value: null;
};
