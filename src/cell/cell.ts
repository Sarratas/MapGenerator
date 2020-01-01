import { CellTypes, CellColor, OffsetRows, OffsetColumns, MovementCosts, HighlightModifiers, HighlightColors } from './cellDefines';
import { IPosition2d, IPositionCube } from '../position';

export class Cell {
    public type: CellTypes;

    public pos: IPosition2d;
    public posCube: IPositionCube;

    public offset: IPosition2d;

    public movementCost: number;

    public movementEnabled: boolean;

    public color: CellColor;
    public highlightColor?: string;
    public highlightModifier: number;

    public get typeString(): string {
        return CellTypes[this.type];
    }

    constructor(pos: IPosition2d, type: CellTypes = CellTypes.None) {
        this.pos = pos;
        this.type = type;

        const cubeX = pos.x - (pos.y - (pos.y & 1)) / 2;
        const cubeZ = pos.y;
        const cubeY = -cubeX - cubeZ;

        this.posCube = {
            x: cubeX,
            z: cubeZ,
            y: cubeY,
        };

        // eliminate negative zero for jest
        if (this.posCube.y === 0) {
            this.posCube.y = 0;
        }

        this.offset = { x: OffsetColumns.Sixth, y: OffsetRows.Second };

        this.movementCost = MovementCosts.Easy;
        this.movementEnabled = true;

        this.color = CellColor.None;
        this.type = type;

        this.highlightModifier = HighlightModifiers.None;
    }

    public getDistanceFrom(target: Cell): number {
        const { x: thisX, y: thisY, z: thisZ } = this.posCube;
        const { x: targetX, y: targetY, z: targetZ } = target.posCube;

        return Math.max(
            Math.abs(thisX - targetX),
            Math.abs(thisY - targetY),
            Math.abs(thisZ - targetZ));
    }

    public convert(): Cell {
        switch (this.type) {
            case CellTypes.Mountain:
                return new MountainCell(this.pos);
            case CellTypes.DeepWater:
                return new DeepWaterCell(this.pos);
            case CellTypes.ShallowWater:
                return new ShallowWaterCell(this.pos);
            case CellTypes.Plain:
                return new PlainCell(this.pos);
            case CellTypes.Highland:
                return new HighlandCell(this.pos);
            case CellTypes.None:
            case CellTypes.Placeholder:
                return new PlaceholderCell(this.pos);
            default:
                throw new TypeError('Unexpected cell type');
        }
    }

    public getHighlightColor(): string {
        if ((this.highlightModifier & HighlightModifiers.Hover) !== 0) {
            return HighlightColors.Hover;
        }

        if ((this.highlightModifier & HighlightModifiers.Select) !== 0) {
            return HighlightColors.Select;
        }

        if ((this.highlightModifier & HighlightModifiers.Path) !== 0) {
            return HighlightColors.Path;
        }

        return HighlightColors.None;
    }
}

export class PlaceholderCell extends Cell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Placeholder);

        this.movementEnabled = false;
        this.color = CellColor.Placeholder;
    }
}

export class LandCell extends Cell {
    constructor(pos: IPosition2d, type: CellTypes) {
        super(pos, type);

        this.movementEnabled = true;
    }
}

export class MountainCell extends LandCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Mountain);

        this.movementCost = MovementCosts.Hard;
        this.color = CellColor.Mountain;

        this.offset = { x: OffsetColumns.Seventh, y: OffsetRows.Third };
    }
}

export class HighlandCell extends LandCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Highland);

        this.movementCost = MovementCosts.Medium;
        this.color = CellColor.Highland;

        this.offset = { x: OffsetColumns.Fifth, y: OffsetRows.Third };
    }
}

export class PlainCell extends LandCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Plain);

        this.movementCost = MovementCosts.Easy;
        this.color = CellColor.Plain;

        this.offset = { x: OffsetColumns.First, y: OffsetRows.First };
    }
}

export class WaterCell extends Cell {
    constructor(pos: IPosition2d, type: CellTypes) {
        super(pos, type);

        this.movementCost = MovementCosts.Impossible;
        this.movementEnabled = false;
    }
}

export class ShallowWaterCell extends WaterCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Water);

        this.color = CellColor.ShallowWater;

        this.offset = { x: OffsetColumns.Fifth, y: OffsetRows.First };
    }
}

export class DeepWaterCell extends WaterCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.DeepWater);

        this.color = CellColor.DeepWater;

        this.offset = { x: OffsetColumns.Seventh, y: OffsetRows.First };
    }
}
