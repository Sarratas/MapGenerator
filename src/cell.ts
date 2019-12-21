export enum CellTypes {
    None            = 0,
    Plain           = 1,
    Highland        = 2,
    Mountain        = 4,
    Land            = Plain | Highland | Mountain,

    ShallowWater    = 128,
    DeepWater       = 256,
    Water           = ShallowWater | DeepWater,

    Placeholder     = 4096,
}

export enum CellColor {
    None            = '#FFFFFF',
    Mountain        = '#A47666',
    ShallowWater    = '#1A9DCE',
    Plain           = '#64815C',
    Highland        = '#D2BC8D',
    DeepWater       = '#1587BE',

    Placeholder     = '#336633',
}

enum OffsetRows {
    First   = 65,
    Second  = 244,
    Third   = 430,
}

enum OffsetColumns {
    First   = 45,
    Second  = 135,
    Third   = 230,
    Fourth  = 323,
    Fifth   = 418,
    Sixth   = 512,
    Seventh = 605,
    Eight   = 700,
}

enum MovementCosts {
    Easy        = 1,
    Medium      = 2,
    Hard        = 4,
    Impossible  = Infinity,
}

export class Cell {
    public type: CellTypes;

    public posX: number;
    public posY: number;

    public offsetX: number;
    public offsetY: number;

    public cubeX: number;
    public cubeY: number;
    public cubeZ: number;

    public movementCost: number;

    public movementEnabled: boolean;

    public color: CellColor;
    public highlightColor?: string;

    constructor(posX: number, posY: number, type: CellTypes = CellTypes.None) {
        this.posX = posX;
        this.posY = posY;
        this.type = type;

        this.cubeX = posX - (posY - (posY & 1)) / 2;
        this.cubeZ = posY;
        this.cubeY = -this.cubeX - this.cubeZ;
        // eliminate negative zero for jest
        if (this.cubeY === 0) {
            this.cubeY = 0;
        }

        this.offsetX = OffsetColumns.Sixth;
        this.offsetY = OffsetRows.Second;

        this.movementCost = MovementCosts.Easy;
        this.movementEnabled = true;

        this.color = CellColor.None;
        this.type = type;
    }

    public getDistanceFrom(target: Cell): number {
        return Math.max(
            Math.abs(this.cubeX - target.cubeX),
            Math.abs(this.cubeY - target.cubeY),
            Math.abs(this.cubeZ - target.cubeZ));
    }

    public convert(): Cell {
        switch (this.type) {
            case CellTypes.Mountain:
                return new MountainCell(this.posX, this.posY);
            case CellTypes.DeepWater:
                return new DeepWaterCell(this.posX, this.posY);
            case CellTypes.ShallowWater:
                return new ShallowWaterCell(this.posX, this.posY);
            case CellTypes.Plain:
                return new PlainCell(this.posX, this.posY);
            case CellTypes.Highland:
                return new HighlandCell(this.posX, this.posY);
            case CellTypes.None:
            case CellTypes.Placeholder:
                return new PlaceholderCell(this.posX, this.posY);
            default:
                throw new TypeError('Unexpected cell type');
        }
    }
}

export class PlaceholderCell extends Cell {
    constructor(posX: number, posY: number) {
        super(posX, posY, CellTypes.Placeholder);

        this.movementEnabled = false;
        this.color = CellColor.Placeholder;
    }
}

export class LandCell extends Cell {
    constructor(posX: number, posY: number, type: CellTypes) {
        super(posX, posY, type);

        this.movementEnabled = true;
    }
}

export class MountainCell extends LandCell {
    constructor(posX: number, posY: number) {
        super(posX, posY, CellTypes.Mountain);

        this.movementCost = MovementCosts.Hard;
        this.color = CellColor.Mountain;

        this.offsetX = OffsetColumns.Seventh;
        this.offsetY = OffsetRows.Third;
    }
}

export class HighlandCell extends LandCell {
    constructor(posX: number, posY: number) {
        super(posX, posY, CellTypes.Highland);

        this.movementCost = MovementCosts.Medium;
        this.color = CellColor.Highland;

        this.offsetX = OffsetColumns.Fifth;
        this.offsetY = OffsetRows.Third;
    }
}

export class PlainCell extends LandCell {
    constructor(posX: number, posY: number) {
        super(posX, posY, CellTypes.Plain);

        this.movementCost = MovementCosts.Easy;
        this.color = CellColor.Plain;

        this.offsetX = OffsetColumns.First;
        this.offsetY = OffsetRows.First;
    }
}

export class WaterCell extends Cell {
    constructor(posX: number, posY: number, type: CellTypes) {
        super(posX, posY, type);

        this.movementCost = MovementCosts.Impossible;
        this.movementEnabled = false;
    }
}

export class ShallowWaterCell extends WaterCell {
    constructor(posX: number, posY: number) {
        super(posX, posY, CellTypes.Water);

        this.color = CellColor.ShallowWater;

        this.offsetX = OffsetColumns.Fifth;
        this.offsetY = OffsetRows.First;
    }
}

export class DeepWaterCell extends WaterCell {
    constructor(posX: number, posY: number) {
        super(posX, posY, CellTypes.DeepWater);

        this.color = CellColor.DeepWater;

        this.offsetX = OffsetColumns.Seventh;
        this.offsetY = OffsetRows.First;
    }
}
