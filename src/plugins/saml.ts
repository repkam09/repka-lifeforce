import { Context, Next } from "koa";
import { SamlConfig, Strategy as SamlStrategy } from "passport-saml";
import passport from "passport";

import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";

export class SSODebug extends LifeforcePlugin {
  constructor(input: LifeforePluginConfiguration) {
    super(input);

    this.addHandlers([
      {
        path: "/api/sso/saml/callback",
        type: "POST",
        handler: this.handlePostSAMLCallback.bind(this),
        auth: false,
      },
      {
        path: "/api/sso/saml/configure",
        type: "POST",
        handler: this.handlePostSAMLConfigure.bind(this),
        auth: false,
      },
      {
        path: "/api/sso/saml/login",
        type: "GET",
        handler: this.handlePostSAMLLogin.bind(this),
        auth: false,
      },
    ]);
  }

  public async init(): Promise<void> {
    Logger.info("SSO Debug initialized");
  }

  private handlePostSAMLCallback(ctx: Context, next: Next) {
    const body: Record<string, any> = ctx.request.body ?? {};

    passport.authenticate(
      "saml",
      (err: Error, user: unknown, info: unknown) => {
        if (err) {
          const response = {
            url: ctx.request.url,
            params: ctx.request.query,
            headers: ctx.request.headers,
            keys: Object.keys(body),
            SAMLResponse: body.SAMLResponse ? "Received" : "Missing",
            RelayState: body.RelayState ? "Received" : "Missing",
          };

          ctx.status = 200;
          ctx.body = {
            error: "SAML Authentication Error",
            details: err,
            debug: response,
          };
          return next();
        }

        if (!user) {
          const response = {
            url: ctx.request.url,
            params: ctx.request.query,
            headers: ctx.request.headers,
            keys: Object.keys(body),
            SAMLResponse: body.SAMLResponse ? "Received" : "Missing",
            RelayState: body.RelayState ? "Received" : "Missing",
          };

          ctx.status = 200;
          ctx.body = {
            error: "SAML Authentication Failed",
            details: info,
            debug: response,
          };
          return next();
        }

        ctx.status = 200;
        ctx.body = { message: "SAML Authentication Successful", user: user };
        return next();
      }
    );

    const response = {
      url: ctx.request.url,
      params: ctx.request.query,
      headers: ctx.request.headers,
      keys: Object.keys(body),
      SAMLResponse: body.SAMLResponse ? "Received" : "Missing",
      RelayState: body.RelayState ? "Received" : "Missing",
    };

    ctx.status = 200;
    ctx.body = response;

    return next();
  }

  private handlePostSAMLConfigure(ctx: Context, next: Next) {
    const body: SamlConfig = ctx.request.body as SamlConfig;

    if (!body.entryPoint || !body.issuer || !body.cert || !body.callbackUrl) {
      ctx.status = 400;
      ctx.body = { error: "Missing required SAML configuration fields" };
      return next();
    }

    passport.use(
      "saml",
      new SamlStrategy(
        body,
        (profile: any, callback: (error: Error | null, user?: any) => void) => {
          return callback(null, profile);
        }
      )
    );

    ctx.status = 200;
    ctx.body = { message: "SAML Configuration Updated", config: body };
    return next();
  }

  private handlePostSAMLLogin(ctx: Context, next: Next) {
    return passport.authenticate("saml")(ctx, next);
  }
}
