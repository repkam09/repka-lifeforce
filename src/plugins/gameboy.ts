import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import { Logger } from "../utils/logger";
import GameBoy from "jsgbc";
import { Canvas, createCanvas } from "canvas";
import { returnNotImplemented, returnSuccess } from "../utils/response";

class GameBoyColorWrapper {
  private static _instance: GameBoy | null = null;
  private static _canvas: Canvas | null = null;

  public static canvas(): Canvas {
    if (GameBoyColorWrapper._canvas === null) {
      GameBoyColorWrapper._canvas = createCanvas(160, 144);
    }
    return GameBoyColorWrapper._canvas;
  }

  public static instance(): GameBoy {
    if (GameBoyColorWrapper.instance === null) {
      GameBoyColorWrapper._instance = new GameBoy({
        audio: false,
        lcd: { canvas: GameBoyColorWrapper.canvas() },
      });
    }
    return GameBoyColorWrapper._instance as GameBoy;
  }

  public static reset() {
    if (GameBoyColorWrapper._instance !== null) {
      GameBoyColorWrapper._instance.stop();
      GameBoyColorWrapper._instance = null;
    }

    if (GameBoyColorWrapper._canvas !== null) {
      GameBoyColorWrapper._canvas = null;
    }
  }
}

export class GameBoyPlugin extends LifeforcePlugin {
  public async init(): Promise<void> {
    Logger.info("GameBoyPlugin initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/gameboy/reset",
        type: "POST",
        handler: handleResetGame,
      },
      {
        path: "/api/gameboy/load",
        type: "POST",
        handler: handleLoadGame,
      },
      {
        path: "/api/gameboy/frame",
        type: "GET",
        handler: handleGetFrame,
      },
      {
        path: "/api/gameboy/input",
        type: "POST",
        handler: handleSendInput,
      },
    ]);
  }
}

function handleSendInput(ctx: Context, next: Next) {
  return returnNotImplemented(ctx, next);
}

function handleGetFrame(ctx: Context, next: Next) {
  return returnNotImplemented(ctx, next);
}

function handleLoadGame(ctx: Context, next: Next) {
  return returnNotImplemented(ctx, next);
}

function handleResetGame(ctx: Context, next: Next) {
  Logger.info("Resetting GameBoy instance");
  GameBoyColorWrapper.reset();

  return returnSuccess(
    false,
    {
      message: "GameBoy Instance Reset",
    },
    ctx,
    next
  );
}
