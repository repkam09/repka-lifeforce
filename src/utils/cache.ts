import Redis from "ioredis";
import { Logger } from "./logger";

type CacheHitData = {
  hasCache: true;
  status: number;
  response: string;
  content: string;
};

type CacheMissData = {
  hasCache: false;
};

type CacheResult = CacheHitData | CacheMissData;

export class Cache {
  private static ready: boolean;
  private static _redis: Redis;

  public static init() {
    if (!Cache._redis) {
      Cache._redis = new Redis();

      Cache._redis.on("ready", () => {
        Cache.ready = true;
      });

      Cache._redis.on("close", () => {
        Cache.ready = false;
      });
    }
  }

  public static async write(
    key: string,
    status: number,
    response: string,
    content: string,
    ttl = 10
  ) {
    if (!Cache.ready) {
      return;
    }

    const data = JSON.stringify({
      status: status,
      response: response,
      content: content,
    });

    await Cache._redis.setex(key, ttl, data);
  }

  public static async read(key: string): Promise<CacheResult> {
    if (!Cache.ready) {
      return { hasCache: false };
    }

    const result = await Cache._redis.get(key);
    if (!result) {
      return { hasCache: false };
    }

    try {
      const json = JSON.parse(result);
      return {
        hasCache: true,
        status: json.status,
        response: json.response,
        content: json.content,
      };
    } catch (err: unknown) {
      const error = err as Error;
      Logger.error(`Error parsing response for ${key}: ${error.message}`);
      return { hasCache: false };
    }
  }

  public static async remove(key: string) {
    if (!Cache.ready) {
      return;
    }

    await Cache._redis.del(key);
  }

  public static async removeBulk(prefix: string) {
    if (!Cache.ready) {
      return;
    }

    const keys: string[] = await Cache._redis.keys(prefix);
    const pipeline = Cache._redis.pipeline();

    keys.forEach((key) => {
      pipeline.del(key);
    });

    await pipeline.exec();
  }
}
