export enum CellType {
    None = '#FFFFFF',
    Mountain = '#CC0000',
    Lake = '#0066CC',
    Plain = '#00CC00',
    Highland = '#CCCC00',

    Placeholder = '#000000',
}

export class Cell {
    public type: CellType;

    public posX: number;
    public posY: number;

    constructor(posX: number, posY: number, type: CellType = CellType.None) {
        this.posX = posX;
        this.posY = posY;
        this.type = type;
    }
}