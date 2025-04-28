import OpenAI, { OpenAIError } from "openai";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class HennosOpenAIProvider {
  public client: OpenAI;
  private history: Map<string, Message[]> = new Map();
  private static tokens: Map<
    string,
    OpenAI.Beta.Realtime.Sessions.SessionCreateResponse.ClientSecret
  > = new Map();

  constructor() {
    this.client = new OpenAI({
      apiKey: Config.OPENAI_API_KEY,
    });
  }

  private prompt(chatId: string, next: Message): Message[] {
    const system: Message[] = [
      {
        role: "system",
        content:
          "You are a conversational assistant named 'Hennos' that is helpful, creative, clever, and friendly.",
      },
      {
        role: "system",
        content:
          "Your job is to assist users in a variety of tasks, including answering questions, providing information, and engaging in conversation.",
      },
      {
        role: "system",
        content:
          "You should respond in concise paragraphs, seperated by two newlines, to maintain readability and clarity.",
      },
      {
        role: "system",
        content:
          "You were created and are maintained by the software developer Mark Repka, @repkam09 on GitHub, and are Open Source on GitHub at https://github.com/repkam09/telegram-gpt-bot",
      },
      {
        role: "system",
        content: `Your knowledge is based on the data your model was trained on, which has a cutoff date of October, 2023. The current date is ${new Date().toDateString()}.`,
      },
      {
        role: "system",
        content:
          "The following is a conversation between you and a user that you are assisting:",
      },
    ];

    if (!this.history.has(chatId)) {
      this.history.set(chatId, []);
    }

    this.history.set(chatId, this.history.get(chatId)!.concat(next));
    return [...system, ...this.history.get(chatId)!.concat(next)];
  }

  public async completion(chatId: string, next: Message): Promise<string> {
    Logger.info(`OpenAI Completion Start (${Config.OPENAI_LLM.MODEL})`);
    return this._completion(chatId, this.prompt(chatId, next), 0);
  }

  public clearExpiredTokens(): void {
    const now = Date.now() / 1000;
    const tokens = Array.from(HennosOpenAIProvider.tokens.entries());

    const expiredTokens: string[] = [];
    for (const [chatId, token] of tokens) {
      if (token.expires_at < now) {
        Logger.info(
          `Token for chatId: ${chatId} has expired, expires_at: ${token.expires_at}, now: ${now}`
        );
        expiredTokens.push(chatId);
      } else {
        Logger.info(
          `Token for chatId: ${chatId} is still valid, expires_at: ${token.expires_at}, now: ${now}`
        );
      }
    }

    expiredTokens.forEach((chatId) =>
      HennosOpenAIProvider.tokens.delete(chatId)
    );
  }

  public async createClientToken(
    chatId: string
  ): Promise<OpenAI.Beta.Realtime.Sessions.SessionCreateResponse.ClientSecret> {
    Logger.info(`OpenAI Realtime Token Request (${chatId})`);

    this.clearExpiredTokens();

    if (HennosOpenAIProvider.tokens.has(chatId)) {
      const token = HennosOpenAIProvider.tokens.get(chatId)!;
      return token;
    }

    const session = await this.client.beta.realtime.sessions.create({
      model: Config.OPENAI_LLM_REALTIME.MODEL,
    });
    const token = session.client_secret;

    HennosOpenAIProvider.tokens.set(chatId, token);
    return token;
  }

  private async _completion(
    chatId: string,
    prompt: Message[],
    depth: number
  ): Promise<string> {
    if (depth > 4) {
      throw new Error("Completion Recursion Depth Exceeded");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: Config.OPENAI_LLM.MODEL,
        messages: prompt,
      });

      Logger.info(
        `OpenAI Completion Success, Usage: ${calculateUsage(
          response.usage
        )} (depth=${depth})`
      );

      if (!response.choices && !response.choices[0]) {
        throw new Error(
          "Invalid OpenAI Response Shape, Missing Expected Choices"
        );
      }

      if (
        !response.choices[0].message.tool_calls &&
        !response.choices[0].message.content
      ) {
        throw new Error(
          "Invalid OpenAI Response Shape, Missing Expected Message Properties"
        );
      }

      // If this is a normal response with no tool calling, return the content
      if (response.choices[0].message.content) {
        if (response.choices[0].finish_reason === "length") {
          Logger.info("OpenAI Completion Success, Resulted in Length Limit");
          prompt.push({
            role: "assistant",
            content: response.choices[0].message.content,
          });
          return this._completion(chatId, prompt, depth + 1);
        }

        Logger.info("OpenAI Completion Success, Resulted in Text Completion");

        this.history.set(
          chatId,
          this.history.get(chatId)!.concat({
            role: "assistant",
            content: response.choices[0].message.content,
          })
        );

        return response.choices[0].message.content;
      }

      if (response.choices[0].message.tool_calls) {
        throw new Error("Tool Calls Not Implemented");
      }

      throw new Error("Invalid OpenAI Response Shape, Unexpected Message Type");
    } catch (err: unknown) {
      Logger.error("OpenAI Completion Error");

      if (err instanceof OpenAIError) {
        Logger.error(`OpenAI Error Response: ${err.message}`);
      }

      throw err;
    }
  }
}

function calculateUsage(
  usage: OpenAI.Completions.CompletionUsage | undefined
): string {
  if (!usage) {
    return "Unknown";
  }

  return `Input: ${usage.prompt_tokens} tokens, Output: ${usage.completion_tokens}`;
}
