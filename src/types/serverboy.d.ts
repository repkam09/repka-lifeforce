declare module "serverboy" {
    export default class GameBoy {
        public pressKey(input: string): void;
        public doFrame(): void;
        public getScreen(): Buffer;
        public loadRom(rom: Buffer): void;
    }
}