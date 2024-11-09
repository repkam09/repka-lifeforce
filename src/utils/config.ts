import dotenv from "dotenv";

dotenv.config();

export class Config {
  static get LIFEFORCE_PORT(): number {
    if (!process.env.LIFEFORCE_PORT) {
      throw new Error("LIFEFORCE_PORT is not set");
    }

    const int = parseInt(process.env.LIFEFORCE_PORT, 10);
    if (isNaN(int)) {
      throw new Error("LIFEFORCE_PORT is not a number");
    }

    return int;
  }

  static get LIFEFORCE_PUBLIC_URL(): string {
    if (!process.env.LIFEFORCE_PUBLIC_URL) {
      throw new Error("LIFEFORCE_PUBLIC_URL is not set");
    }

    return process.env.LIFEFORCE_PUBLIC_URL;
  }

  static get LIFEFORCE_LOCAL_IPS(): string[] {
    if (!process.env.LIFEFORCE_LOCAL_IPS) {
      throw new Error("LIFEFORCE_LOCAL_IPS is not set");
    }

    return process.env.LIFEFORCE_LOCAL_IPS.split(",").map((ip) => ip.trim());
  }

  static get LIFEFORCE_DEBUG_MODE(): boolean {
    if (!process.env.LIFEFORCE_DEBUG_MODE) {
      return false;
    }

    return process.env.LIFEFORCE_DEBUG_MODE === "true";
  }

  static get REDIS_ENABLED(): boolean {
    if (!process.env.REDIS_ENABLED) {
      return false;
    }

    return process.env.REDIS_ENABLED === "true";
  }

  static get WEATHER_API_KEY(): string {
    if (!process.env.WEATHER_API_KEY) {
      throw new Error("WEATHER_API_KEY is not set");
    }

    return process.env.WEATHER_API_KEY;
  }

  static get LAST_FM_API_KEY(): string {
    if (!process.env.LAST_FM_API_KEY) {
      throw new Error("LAST_FM_API_KEY is not set");
    }

    return process.env.LAST_FM_API_KEY;
  }

  static get LIFEFORCE_MEDIA_MOUNT(): string {
    if (!process.env.LIFEFORCE_MEDIA_MOUNT) {
      throw new Error("LIFEFORCE_MEDIA_MOUNT is not set");
    }

    return process.env.LIFEFORCE_MEDIA_MOUNT;
  }

  static get LIFEFORCE_MEDIA_PREFIX(): string {
    if (!process.env.LIFEFORCE_MEDIA_PREFIX) {
      throw new Error("LIFEFORCE_MEDIA_PREFIX is not set");
    }

    return process.env.LIFEFORCE_MEDIA_PREFIX;
  }

  static get LIFEFORCE_AUTH_TOKEN(): string {
    if (!process.env.LIFEFORCE_AUTH_TOKEN) {
      throw new Error("LIFEFORCE_AUTH_TOKEN is not set");
    }

    return process.env.LIFEFORCE_AUTH_TOKEN;
  }

  static get LIFEFORCE_REPCAST_TOKEN(): string {
    if (!process.env.LIFEFORCE_REPCAST_TOKEN) {
      throw new Error("LIFEFORCE_REPCAST_TOKEN is not set");
    }

    return process.env.LIFEFORCE_REPCAST_TOKEN;
  }

  static get TRANSMISION_PORT(): number {
    if (!process.env.TRANSMISION_PORT) {
      throw new Error("TRANSMISION_PORT is not set");
    }

    const int = parseInt(process.env.TRANSMISION_PORT, 10);
    if (isNaN(int)) {
      throw new Error("TRANSMISION_PORT is not a number");
    }

    return int;
  }

  static get TRANSMISSION_HOST(): string {
    if (!process.env.TRANSMISSION_HOST) {
      throw new Error("TRANSMISSION_HOST is not set");
    }

    return process.env.TRANSMISSION_HOST;
  }

  static get TRANSMISSION_USER(): string | undefined {
    return process.env.TRANSMISSION_USER;
  }

  static get TRANSMISION_PASS(): string | undefined {
    return process.env.TRANSMISION_PASS;
  }

  static get LIFEFORCE_EMAIL_NOTIFY(): string[] {
    if (!process.env.LIFEFORCE_EMAIL_NOTIFY) {
      throw new Error("LIFEFORCE_EMAIL_NOTIFY is not set");
    }

    // this will be a comma separated list of emails
    return process.env.LIFEFORCE_EMAIL_NOTIFY.split(",").map((email) =>
      email.trim()
    );
  }

  static get LIFEFORCE_EMAIL_USER(): string {
    if (!process.env.LIFEFORCE_EMAIL_USER) {
      throw new Error("LIFEFORCE_EMAIL_USER is not set");
    }

    return process.env.LIFEFORCE_EMAIL_USER;
  }

  static get LIFEFORCE_EMAIL_PASS(): string {
    if (!process.env.LIFEFORCE_EMAIL_PASS) {
      throw new Error("LIFEFORCE_EMAIL_PASS is not set");
    }

    return process.env.LIFEFORCE_EMAIL_PASS;
  }

  static get MONGO_DB_URL(): string {
    if (!process.env.MONGO_DB_URL) {
      throw new Error("MONGO_DB_URL is not set");
    }

    return process.env.MONGO_DB_URL;
  }

  static get MONGO_DB_HOST(): string {
    if (!process.env.MONGO_DB_HOST) {
      throw new Error("MONGO_DB_HOST is not set");
    }

    return process.env.MONGO_DB_HOST;
  }

  static get MONGO_DB_PORT(): number {
    if (!process.env.MONGO_DB_PORT) {
      throw new Error("MONGO_DB_PORT is not set");
    }

    const int = parseInt(process.env.MONGO_DB_PORT, 10);
    if (isNaN(int)) {
      throw new Error("MONGO_DB_PORT is not a number");
    }

    return int;
  }
}
