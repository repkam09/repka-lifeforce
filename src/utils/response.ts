import { Context, Next } from "koa";

export function returnUnauthorized(ctx: Context, next: Next) {
  ctx.status = 401;
  ctx.body = {
    error: "Unauthorized",
  };
  return next();
}

export function returnBadRequest(ctx: Context, next: Next) {
  ctx.status = 400;
  ctx.body = {
    error: "Bad Request",
  };
  return next();
}

export function returnInternalError(ctx: Context, next: Next) {
  ctx.status = 500;
  ctx.body = {
    error: "Internal Error",
  };
  return next();
}

export function returnSuccess(
  cache: boolean,
  data: any,
  ctx: Context,
  next: Next
) {
  ctx.status = 200;
  ctx.body = {
    error: false,
    cached: cache,
    data: data,
  };
  return next();
}
