import { SupabaseClient, User } from "@supabase/supabase-js";
import { Config } from "./config";
import { Context } from "koa";
import { HennosCacheHandler } from "../hennos/storage";
import { Logger } from "./logger";

export async function validateAdminAuth(
  supabase: SupabaseClient,
  ctx: Context
): Promise<{ token: string; user: User } | false> {
  const user = await validateAuth(supabase, ctx);
  if (!user) {
    return false;
  }

  if (!Config.LIFEFORCE_ADMIN_UUIDS.includes(user.user.id)) {
    return false;
  }

  return { token: user.token, user: user.user };
}

export async function validateAuth(
  supabase: SupabaseClient,
  ctx: Context
): Promise<{ token: string; user: User; cached: boolean } | false> {
  let sessionToken: string | false = false;

  if (ctx.cookies.get("repka-lifeforce-session")) {
    sessionToken = ctx.cookies.get("repka-lifeforce-session") as string;
  }

  if (ctx.query.token) {
    sessionToken = ctx.query.token as string;
  }

  if (ctx.headers.authorization) {
    sessionToken = ctx.headers.authorization.replace("Bearer ", "");
  }

  if (!sessionToken) {
    return false;
  }

  // check if we have a cached result for this token
  const cachedUser = HennosCacheHandler.get<User>(sessionToken);
  if (cachedUser) {
    return {
      cached: true,
      token: sessionToken,
      user: cachedUser,
    };
  }

  const user = await supabase.auth.getUser(sessionToken);
  if (user.error) {
    console.error(`Supabase error: ${user.error.message}`);
    return false;
  }

  if (user.data.user) {
    HennosCacheHandler.set(sessionToken, user.data.user);
    return {
      cached: false,
      token: sessionToken,
      user: user.data.user,
    };
  }

  return false;
}

export async function validateStaticAuth(ctx: Context): Promise<boolean> {
  if (ctx.query.token) {
    if (Config.LIFEFORCE_AUTH_TOKEN === ctx.query.token) {
      return true;
    }
  }

  if (ctx.headers.authorization) {
    const cleanedToken = ctx.headers.authorization.replace("Bearer ", "");
    if (Config.LIFEFORCE_AUTH_TOKEN === cleanedToken) {
      return true;
    }
  }

  Logger.warn(
    "Unauthorized access attempt to Lifeforce API with Static token."
  );
  return false;
}
