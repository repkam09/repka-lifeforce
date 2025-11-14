import { Context, Next } from "koa";
import { SamlConfig, Strategy as SamlStrategy } from "passport-saml";
import passport from "koa-passport";

import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { Config } from "../utils/config";

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
        handler: this.handleGetSAMLLogin.bind(this),
        auth: false,
      },
    ]);

    // Configure a default mock SAML provider with mock data
    this.configureSamlStrategy({
      entryPoint: "https://mocksaml.com/api/saml/sso",
      issuer: "lifeforce",
      audience: "lifeforce",
      cert: "MIIC4jCCAcoCCQC33wnybT5QZDANBgkqhkiG9w0BAQsFADAyMQswCQYDVQQGEwJVSzEPMA0GA1UECgwGQm94eUhRMRIwEAYDVQQDDAlNb2NrIFNBTUwwIBcNMjIwMjI4MjE0NjM4WhgPMzAyMTA3MDEyMTQ2MzhaMDIxCzAJBgNVBAYTAlVLMQ8wDQYDVQQKDAZCb3h5SFExEjAQBgNVBAMMCU1vY2sgU0FNTDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALGfYettMsct1T6tVUwTudNJH5Pnb9GGnkXi9Zw/e6x45DD0RuRONbFlJ2T4RjAE/uG+AjXxXQ8o2SZfb9+GgmCHuTJFNgHoZ1nFVXCmb/Hg8Hpd4vOAGXndixaReOiq3EH5XvpMjMkJ3+8+9VYMzMZOjkgQtAqO36eAFFfNKX7dTj3VpwLkvz6/KFCq8OAwY+AUi4eZm5J57D31GzjHwfjH9WTeX0MyndmnNB1qV75qQR3b2/W5sGHRv+9AarggJkF+ptUkXoLtVA51wcfYm6hILptpde5FQC8RWY1YrswBWAEZNfyrR4JeSweElNHg4NVOs4TwGjOPwWGqzTfgTlECAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAAYRlYflSXAWoZpFfwNiCQVE5d9zZ0DPzNdWhAybXcTyMf0z5mDf6FWBW5Gyoi9u3EMEDnzLcJNkwJAAc39Apa4I2/tml+Jy29dk8bTyX6m93ngmCgdLh5Za4khuU3AM3L63g7VexCuO7kwkjh/+LqdcIXsVGO6XDfu2QOs1Xpe9zIzLpwm/RNYeXUjbSj5ce/jekpAw7qyVVL4xOyh8AtUW1ek3wIw1MJvEgEPt0d16oshWJpoS1OT8Lr/22SvYEo3EmSGdTVGgk3x3s+A0qWAqTcyjr7Q4s/GKYRFfomGwz0TZ4Iw1ZN99Mm0eo2USlSRTVl7QHRTuiuSThHpLKQQ==",
      callbackUrl: Config.LIFEFORCE_PUBLIC_URL + "/api/sso/saml/callback",
    });
  }

  public async init(): Promise<void> {
    Logger.info("SSO Debug initialized");
  }

  private handlePostSAMLCallback(ctx: Context, next: Next) {
    const body: Record<string, any> = ctx.request.body ?? {};
    return passport.authenticate(
      "saml",
      (err: Error, user: unknown, info: unknown) => {
        Logger.info("SAML Authentication Callback Invoked");
        if (err) {
          ctx.status = 200;
          ctx.body = {
            error: "SAML Authentication Error",
            details: err,
          };
          return next();
        }

        if (!user) {
          ctx.status = 200;
          ctx.body = {
            error: "SAML Authentication Failed",
            details: info,
          };
          return next();
        }

        ctx.status = 200;
        ctx.body = {
          error: null,
          details: {
            params: ctx.request.query,
            headers: ctx.request.headers,
            keys: Object.keys(body),
            SAMLResponse: body.SAMLResponse ? "Received" : "Missing",
            RelayState: body.RelayState ? "Received" : "Missing",
          },
          user: user,
          relayState: body.RelayState || null,
        };
        return next();
      }
    )(ctx, next);
  }

  private handlePostSAMLConfigure(ctx: Context, next: Next) {
    const body: SamlConfig = ctx.request.body as SamlConfig;

    if (!body.entryPoint || !body.issuer || !body.cert || !body.callbackUrl) {
      ctx.status = 400;
      ctx.body = { error: "Missing required SAML configuration fields" };
      return next();
    }

    Logger.info("Configuring SAML Strategy with provided settings");
    this.configureSamlStrategy(body);

    ctx.status = 200;
    ctx.body = { message: "SAML Configuration Updated", config: body };
    return next();
  }

  private configureSamlStrategy(config: SamlConfig) {
    passport.use(
      "saml",
      new SamlStrategy(
        config,
        (profile: any, callback: (error: Error | null, user?: any) => void) => {
          Logger.info("SAML Strategy Callback Invoked");
          return callback(null, profile);
        }
      )
    );
  }

  private handleGetSAMLLogin(ctx: Context, next: Next) {
    Logger.info("SAML Login Handler Invoked");
    return passport.authenticate("saml", {
      additionalParams: {
        RelayState: ctx.query.RelayState || "",
      },
    })(ctx, next);
  }
}
