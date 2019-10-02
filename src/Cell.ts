export enum CellType {
    None = '#FFFFFF',
    Mountain = '#A47666',
    Water = '#1A9DCE',
    Plain = '#64815C',
    Highland = '#D2BC8D',
    DeepWater = '#1587BE',

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