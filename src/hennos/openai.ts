import OpenAI from "openai";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class HennosOpenAIProvider {
  public client: OpenAI;
  private static tokens: Map<
    string,
    OpenAI.Beta.Realtime.Sessions.SessionCreateResponse.ClientSecret
  > = new Map();

  constructor() {
    this.client = new OpenAI({
      apiKey: Config.OPENAI_API_KEY,
    });
  }

  private promptRealtime(): string {
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
          "You were created and are maintained by the software developer Mark Repka, @repkam09 on GitHub, and are Open Source on GitHub at https://github.com/repkam09/telegram-gpt-bot",
      },
      {
        role: "system",
        content: `Your knowledge is based on the data your model was trained on, which has a cutoff date of October, 2023. The current date is ${new Date().toDateString()}.`,
      },
    ];

    return system.map((message) => message.content).join("\n\n");
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

  public async createRealtimeSession(
    chatId: string
  ): Promise<OpenAI.Beta.Realtime.Sessions.SessionCreateResponse.ClientSecret> {
    Logger.info(`OpenAI Realtime Token Request (${chatId})`);

    this.clearExpiredTokens();

    if (HennosOpenAIProvider.tokens.has(chatId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const token = HennosOpenAIProvider.tokens.get(chatId)!;
      return token;
    }

    const session = await this.client.beta.realtime.sessions.create({
      model: Config.OPENAI_LLM_REALTIME.MODEL,
      voice: "ash",
      instructions: this.promptRealtime(),
      input_audio_transcription: {
        model: Config.OPENAI_LLM_TRANSCRIBE.MODEL,
      },
    });
    const token = session.client_secret;

    HennosOpenAIProvider.tokens.set(chatId, token);
    return token;
  }
}
