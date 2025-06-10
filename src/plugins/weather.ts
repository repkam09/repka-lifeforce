import { Context, Next } from "koa";
import { z } from "zod";
import {
  LifeforcePlugin,
  LifeforePluginConfiguration,
} from "../utils/LifeforcePlugin";
import axios from "axios";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export class Weather extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("Weather initialized");
  }

  constructor(input: LifeforePluginConfiguration) {
    super(input);
    this.addHandlers([
      {
        path: "/api/weather/current/zip/:zip",
        type: "GET",
        handler: this.handleWeatherZipCode.bind(this),
      },
      {
        path: "/api/weather/forecast/zip/:zip",
        type: "GET",
        handler: this.handleWeatherForecastZipCode.bind(this),
      },
    ]);

    this.mcp.resource(
      "weather-current",
      new ResourceTemplate("lifeforce://weather-current/{zipCode}", {
        list: undefined,
      }),
      async (uri, params) => {
        const result = await weatherCurrentZipCode(params.zipCode as string);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(result.data),
            },
          ],
        };
      }
    );

    this.mcp.tool(
      "weather-current",
      "Get current weather for a zip code",
      { zipCode: z.string() },
      async ({ zipCode }) => {
        Logger.info(`MCP Current Weather: ${zipCode}`);
        const result = await weatherCurrentZipCode(zipCode);
        return {
          content: [{ type: "text", text: JSON.stringify(result.data) }],
        };
      }
    );

    this.mcp.tool(
      "weather-forecast",
      "Get weather forecast for a zip code",
      { zipCode: z.string() },
      async ({ zipCode }) => {
        Logger.info(`MCP Forecast Weather: ${zipCode}`);
        const result = await weatherForecastZipCode(zipCode);
        return {
          content: [{ type: "text", text: JSON.stringify(result.data) }],
        };
      }
    );

    this.mcp.resource(
      "weather-forecast",
      new ResourceTemplate("lifeforce://weather-forecast/{zipCode}", {
        list: undefined,
      }),
      async (uri, params) => {
        const result = await weatherForecastZipCode(params.zipCode as string);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(result.data),
            },
          ],
        };
      }
    );
  }

  private async handleWeatherZipCode(ctx: Context, next: Next) {
    const zip = ctx.params.zip;
    if (zip) {
      Logger.debug(`Looking up weather for ${zip}`);
      try {
        const response = await weatherCurrentZipCode(zip);
        ctx.status = 200;
        ctx.body = response.data;
      } catch (err: unknown) {
        const error = err as Error;
        Logger.error(
          `Unable to get current weather for ${zip}, err: ${error.message}`
        );
        ctx.status = 500;
      }
    } else {
      Logger.debug("Bad request for current weather");
      ctx.status = 400;
    }
    return next();
  }

  private async handleWeatherForecastZipCode(ctx: Context, next: Next) {
    const zip = ctx.params.zip;
    if (zip) {
      Logger.debug(`Looking up weather forecast for ${zip}`);
      try {
        const response = await weatherForecastZipCode(zip);
        ctx.status = 200;
        ctx.body = response.data;
      } catch (err: unknown) {
        const error = err as Error;
        Logger.error(
          `Unable to get weather forecast for ${zip}, err: ${error.message}`
        );
        ctx.status = 500;
      }
    } else {
      Logger.debug("Bad request for weather forecast");
      ctx.status = 400;
    }
    return next();
  }
}

export async function weatherForecastZipCode(zip: string) {
  return axios.get(
    `http://api.openweathermap.org/data/2.5/forecast?zip=${zip}&appid=${Config.WEATHER_API_KEY}`
  );
}

export async function weatherCurrentZipCode(zip: string) {
  return axios.get(
    `http://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${Config.WEATHER_API_KEY}`
  );
}
