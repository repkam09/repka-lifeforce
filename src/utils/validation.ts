import { SupabaseClient, User } from "@supabase/supabase-js";
import { Config } from "./config";
import { Context } from "koa";
import { HennosCacheHandler } from "../hennos/storage";

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
  if (ctx.query.token) {
    // check if we have a cached result for this token
    const cachedUser = HennosCacheHandler.get<User>(ctx.query.token as string);
    if (cachedUser) {
      return {
        cached: true,
        token: ctx.query.token as string,
        user: cachedUser,
      };
    }

    const user = await supabase.auth.getUser(ctx.query.token as string);
    if (user.error) {
      console.error(`Supabase error: ${user.error.message}`);
      return false;
    }

    if (user.data.user) {
      HennosCacheHandler.set(ctx.query.token as string, user.data.user);
      return {
        cached: false,
        token: ctx.query.token as string,
        user: user.data.user,
      };
    }
  }

  if (ctx.headers.authorization) {
    const cleanedToken = ctx.headers.authorization.replace("Bearer ", "");

    // check if we have a cached result for this token
    const cachedUser = HennosCacheHandler.get<User>(cleanedToken);
    if (cachedUser) {
      console.log("Returning cached user from header");
      return {
        cached: true,
        token: cleanedToken,
        user: cachedUser,
      };
    }

    const user = await supabase.auth.getUser(cleanedToken);
    if (user.error) {
      console.error(`Supabase error: ${user.error.message}`);
      return false;
    }

    if (user.data.user) {
      HennosCacheHandler.set(cleanedToken, user.data.user);
      return {
        cached: false,
        token: cleanedToken,
        user: user.data.user,
      };
    }
  }

  return false;
}
