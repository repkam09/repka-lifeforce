import GameBoy from "serverboy";
import { PNG } from "pngjs";
import sharp from "sharp";


type GBAInputs = "RIGHT" | "LEFT" | "UP" | "DOWN" | "A" | "B" | "SELECT" | "START";
export class GameBoyColorWrapper {
    private _instance: GameBoy;

    constructor() {
        this._instance = new GameBoy();
    }

    public tick(input: GBAInputs | undefined = undefined) {
        // Perform 1 second of emulation
        for (let i = 0; i < 5; i++) {
            if (input) {
                this._instance.pressKey(input);
            }
            this._instance.doFrame();
        }
        for (let i = 0; i < 55; i++) {
            this._instance.doFrame();
        }
    }

    public async getFrame(scale: number): Promise<Buffer> {
        // Grab the screen buffer, 160x144 pixels, 4 bytes per pixel (RGBA)
        const frame = this._instance.getScreen();

        // Write the frame to a PNG
        const png = new PNG({ width: 160, height: 144 });
        for (let i = 0; i < frame.length; i++) {
            png.data[i] = frame[i];
        }

        // Save the PNG to a buffer for later retrieval
        const temp = PNG.sync.write(png);

        // Resize the image

        const result = await sharp(temp).resize(160 * scale, 144 * scale).png().toBuffer();

        return result;
    }

    public async load(rom: Buffer) {
        this._instance.loadRom(rom);
    }
}
