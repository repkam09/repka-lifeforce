import OpenAI from "openai";

type HennosUserStorage = {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any[];
};

type HennosUserId = string;

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class HennosStorageHandler {
  private static storage: Map<HennosUserId, HennosUserStorage> = new Map();

  public static append(userId: string, message: Message): void {
    if (!HennosStorageHandler.storage.has(userId)) {
      HennosStorageHandler.storage.set(userId, { userId, history: [] });
    }

    const storage = HennosStorageHandler.storage.get(userId);
    if (!storage) {
      throw new Error(`Storage map not found for user ${userId}`);
    }

    storage.history.push(message);
  }

  public static get(userId: string): Message[] {
    const storage = HennosStorageHandler.storage.get(userId);
    if (!storage) {
      return [];
    }

    return storage.history;
  }
}

export class HennosCacheHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static cache: Map<string, any> = new Map();

  public static get<T>(key: string): T | undefined {
    return HennosCacheHandler.cache.get(key);
  }

  public static set<T>(key: string, value: T): void {
    HennosCacheHandler.cache.set(key, value);
  }

  public static has(key: string): boolean {
    return HennosCacheHandler.cache.has(key);
  }

  public static clear(): void {
    HennosCacheHandler.cache.clear();
  }
}
