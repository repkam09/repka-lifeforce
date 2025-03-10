import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import { returnBadRequest, returnSuccess } from "../utils/response";
import { GameBoyColorWrapper } from "../gameboy";
import { readFile } from "node:fs/promises";
import { Config } from "../utils/config";

export class GameBoyPlugin extends LifeforcePlugin {

  private static _gameboy: GameBoyColorWrapper = new GameBoyColorWrapper();

  public async init(): Promise<void> {
    Logger.info("GameBoyPlugin initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/gameboy/load",
        type: "POST",
        handler: this.handleLoadGame,
        auth: false
      },
      {
        path: "/api/gameboy/tick",
        type: "GET",
        handler: this.handleGetFrame,
        auth: false
      },
      {
        path: "/api/gameboy/input",
        type: "POST",
        handler: this.handleSendInput,
        auth: false
      },
    ]);
  }

  private async handleSendInput(ctx: Context, next: Next) {
    const body = ctx.request.body as any;
    if (!body || !body.input) {
      return returnBadRequest(ctx, next);
    }

    const valid = [
      "RIGHT",
      "LEFT",
      "UP",
      "DOWN",
      "A",
      "B",
      "SELECT",
      "START"
    ];
    if (Array.isArray(body.input)) {
      for (const input of body.input) {
        if (!valid.includes(input)) {
          return returnBadRequest(ctx, next);
        }
      }

      Logger.info("Sending input to GameBoy instance");
      for (const input of body.input) {
        GameBoyPlugin._gameboy.tick(input);
      }
    } else {
      if (!valid.includes(body.input)) {
        return returnBadRequest(ctx, next);
      }

      Logger.info("Sending input to GameBoy instance");
      GameBoyPlugin._gameboy.tick(body.input);
    }

    const frame = await GameBoyPlugin._gameboy.getFrame(4);

    ctx.body = frame;
    ctx.type = "png";
    ctx.status = 200;
    return next();
  }

  private async handleGetFrame(ctx: Context, next: Next) {
    Logger.info("Getting frame from GameBoy instance");
    GameBoyPlugin._gameboy.tick();
    const frame = await GameBoyPlugin._gameboy.getFrame(4);

    ctx.body = frame;
    ctx.type = "png";
    ctx.status = 200;
    return next();
  }

  private async handleLoadGame(ctx: Context, next: Next) {
    const body = ctx.request.body as any;
    if (!body || !body.rom) {
      return returnBadRequest(ctx, next);
    }

    const rom = await readFile(`${Config.GAME_ROM_LOCATION}/Pokemon Red.gb`);
    if (!rom) {
      return returnBadRequest(ctx, next);
    }

    GameBoyPlugin._gameboy.load(rom);
    return returnSuccess(false, { message: "Success" }, ctx, next);
  }
}
