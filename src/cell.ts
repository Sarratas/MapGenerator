export enum CellType {
    None = '#FFFFFF',
    Mountain = '#A47666',
    Water = '#1A9DCE',
    Plain = '#64815C',
    Highland = '#D2BC8D',
    DeepWater = '#1587BE',

    Placeholder = '#000000',
}

enum OffsetRows {
    First = 65,
    Second = 244,
    Third = 430,
}

enum OffsetColumns {
    First = 45,
    Second = 135,
    Third = 230,
    Fourth = 323,
    Fifth = 418,
    Sixth = 512,
    Seventh = 605,
    Eight = 700,
}

export class Cell {
    public type: CellType;

    public posX: number;
    public posY: number;

    public offsetX: number;
    public offsetY: number;

    public cubeX: number;
    public cubeY: number;
    public cubeZ: number;

    constructor(posX: number, posY: number, type: CellType = CellType.None) {
        this.posX = posX;
        this.posY = posY;
        this.type = type;

        this.cubeX = posX - (posY - (posY & 1)) / 2;
        this.cubeZ = posY;
        this.cubeY = -this.cubeX - this.cubeZ;

        this.setSpriteOffset(type);
    }

    public setType(type: CellType) {
        this.type = type;
        this.setSpriteOffset(type);
    }

    public getMovementCost(): number {
        switch (this.type) {
            case CellType.Mountain:
                return 4;
            case CellType.Highland:
                return 2;
            default:
                return 1;
        }
    }

    public getDistanceFrom(target: Cell): number {
        return Math.max(
            Math.abs(this.cubeX - target.cubeX),
            Math.abs(this.cubeY - target.cubeY),
            Math.abs(this.cubeZ - target.cubeZ));
    }

    public isMovementDisabled(): boolean {
        return this.type === CellType.Water || this.type === CellType.DeepWater;
    }

    private setSpriteOffset(type: CellType) {
        switch (type) {
            case CellType.Mountain:
                this.offsetX = OffsetColumns.Seventh;
                this.offsetY = OffsetRows.Third;
                break;
            case CellType.Water:
                this.offsetX = OffsetColumns.Fifth;
                this.offsetY = OffsetRows.First;
                break;
            case CellType.Plain:
                this.offsetX = OffsetColumns.First;
                this.offsetY = OffsetRows.First;
                break;
            case CellType.Highland:
                this.offsetX = OffsetColumns.Fifth;
                this.offsetY = OffsetRows.Third;
                break;
            case CellType.DeepWater:
                this.offsetX = OffsetColumns.Seventh;
                this.offsetY = OffsetRows.First;
                break;
            case CellType.Placeholder:
            case CellType.None:
                this.offsetX = OffsetColumns.Sixth;
                this.offsetY = OffsetRows.Second;
                break;
            default:
                break;
        }
    }
}
