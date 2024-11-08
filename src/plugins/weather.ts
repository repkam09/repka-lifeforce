import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import axios from "axios";
import { Config } from "../utils/config";

export class Weather extends LifeforcePlugin {
  public init(): void {
    console.log("Weather initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
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
  }

  private async handleWeatherZipCode(ctx: Context, next: Next) {
    const zip = ctx.params.zip;
    if (zip) {
      console.log(`Looking up weather for ${zip}`);
      try {
        const url = `http://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${Config.WEATHER_API_KEY}`;
        const response = await axios.get(url);
        ctx.status = 200;
        ctx.body = response.data;
      } catch (err: unknown) {
        const error = err as Error;
        console.error(
          `Unable to get current weather for ${zip}, err: ${error.message}`
        );
        ctx.status = 500;
      }
    } else {
      console.log("Bad request for current weather");
      ctx.status = 400;
    }
    return next();
  }

  private async handleWeatherForecastZipCode(ctx: Context, next: Next) {
    const zip = ctx.params.zip;
    if (zip) {
      console.log(`Looking up weather forecast for ${zip}`);
      try {
        const url = `http://api.openweathermap.org/data/2.5/forecast?zip=${zip}&appid=${Config.WEATHER_API_KEY}`;
        const response = await axios.get(url);
        ctx.status = 200;
        ctx.body = response.data;
      } catch (err: unknown) {
        const error = err as Error;
        console.error(
          `Unable to get weather forecast for ${zip}, err: ${error.message}`
        );
        ctx.status = 500;
      }
    } else {
      console.log("Bad request for weather forecast");
      ctx.status = 400;
    }
    return next();
  }
}
