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
