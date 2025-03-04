/* eslint-disable @typescript-eslint/no-explicit-any */

import dotenv from "dotenv";

dotenv.config();

export type HennosModelConfig = {
  MODEL: any;
  CTX: number;
};

export type HennosEmbeddingModelConfig = {
  MODEL: any;
  CTX: number;
};

export class Config {
  static get HOME_ASSISTANT_TOKEN(): string | false {
    if (!process.env.HOME_ASSISTANT_TOKEN) {
      return false;
    }

    return process.env.HOME_ASSISTANT_TOKEN;
  }

  static get SUPABASE_API_KEY(): string {
    if (!process.env.SUPABASE_API_KEY) {
      throw new Error("SUPABASE_API_KEY is not set");
    }

    return process.env.SUPABASE_API_KEY;
  }

  static get SUPABASE_SERVICE_KEY(): string {
    if (!process.env.SUPABASE_SERVICE_KEY) {
      throw new Error("SUPABASE_SERVICE_KEY is not set");
    }

    return process.env.SUPABASE_SERVICE_KEY;
  }

  static get SUPABASE_URL(): string {
    if (!process.env.SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not set");
    }

    return process.env.SUPABASE_URL;
  }

  static get LIFEFORCE_ADMIN_UUIDS(): string[] {
    if (!process.env.LIFEFORCE_ADMIN_UUIDS) {
      throw new Error("LIFEFORCE_ADMIN_UUIDS is not set");
    }

    return process.env.LIFEFORCE_ADMIN_UUIDS.split(",").map((uuid) =>
      uuid.trim()
    );
  }

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

  static get WS_SERVER_ENABLED(): boolean {
    if (!process.env.WS_SERVER_ENABLED) {
      return false;
    }

    return process.env.WS_SERVER_ENABLED === "true";
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

  static get LIFEFORCE_SKIP_EMAIL(): boolean {
    return process.env.LIFEFORCE_SKIP_EMAIL === "true";
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

  static get WS_SERVER_HOST(): string {
    if (!process.env.WS_SERVER_HOST) {
      throw new Error("WS_SERVER_HOST is not set");
    }

    return process.env.WS_SERVER_HOST;
  }

  static get WS_SERVER_PORT(): number {
    if (!process.env.WS_SERVER_PORT) {
      throw new Error("WS_SERVER_PORT is not set");
    }

    const int = parseInt(process.env.WS_SERVER_PORT, 10);
    if (isNaN(int)) {
      throw new Error("WS_SERVER_PORT is not a number");
    }

    return int;
  }

  static get WS_SERVER_TOKEN(): string {
    if (!process.env.WS_SERVER_TOKEN) {
      throw new Error("WS_SERVER_TOKEN is not set");
    }

    return process.env.WS_SERVER_TOKEN;
  }

  static get OPENAI_API_KEY(): string {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    return process.env.OPENAI_API_KEY;
  }

  static get OPENAI_LLM(): HennosModelConfig {
    if (!process.env.OPENAI_LLM) {
      return {
        MODEL: "gpt-4o-mini",
        CTX: 32000,
      };
    }

    return parseHennosModelString(process.env.OPENAI_LLM, "OPENAI_LLM");
  }

  static get OPENAI_LLM_EMBED(): HennosEmbeddingModelConfig {
    if (!process.env.OPENAI_LLM_EMBED) {
      return {
        MODEL: "text-embedding-3-small",
        CTX: 8191,
      };
    }

    const parts = process.env.OPENAI_LLM_EMBED.split(",");
    const ctx = parseInt(parts[1]);

    if (Number.isNaN(ctx)) {
      throw new Error("Invalid context length value for OPENAI_LLM_EMBED");
    }

    return {
      MODEL: parts[0],
      CTX: ctx,
    };
  }
}

function parseHennosModelString(value: string, env: string): HennosModelConfig {
  const parts = value.split(",");

  if (parts.length !== 2) {
    throw new Error(`Invalid value for ${env}`);
  }

  const ctxInLength = parseInt(parts[1]);

  if (Number.isNaN(ctxInLength)) {
    throw new Error("Invalid context length value for " + env);
  }

  return {
    MODEL: parts[0],
    CTX: ctxInLength,
  };
}
