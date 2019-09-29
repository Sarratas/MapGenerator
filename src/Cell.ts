export enum CellType {
    None = '#FFFFFF',
    Mountain = '#CC0000',
    Lake = '#0066CC',
    Plain = '#00CC00',
    Highland = '#CCCC00',
}

export class Cell {
    public type: CellType;
    public posX: number;
    public posY: number;

    private cellSize: number = 1;

    constructor(posX: number, posY: number) {
        this.posX = posX;
        this.posY = posY;
        this.type = CellType.None;
    }

    public render(context: CanvasRenderingContext2D, posX: number, posY: number, scale: number): void {
        context.fillStyle = this.type;

        let startX = posX * scale;
        let startY = posY * scale;
        context.fillRect(startX, startY, this.cellSize * scale, this.cellSize * scale);
    }
}