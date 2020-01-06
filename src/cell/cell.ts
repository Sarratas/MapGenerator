import { CellTypes, CellTerrainColor, OffsetRows, OffsetColumns,
    MovementCosts, HighlightModifiers, HighlightColors, CellConstant } from './cellDefines';
import { IPosition2d, IPositionCube } from '../shared/position';
import { MapMode } from '../map/worldMap';
import { Nation } from '../map/nation';

export class Cell {
    public type: CellTypes;

    public pos: IPosition2d;
    public posCube: IPositionCube;

    public offset: IPosition2d;

    public movementCost: number;

    public movementEnabled: boolean;

    public terrainColor: CellTerrainColor;
    public highlightColor?: string;
    public highlightModifier: number;

    public nation: Nation | undefined;

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

        this.terrainColor = CellTerrainColor.None;

        this.type = type;

        this.highlightModifier = HighlightModifiers.None;
    }

    public getFillColorForMode(mode: MapMode): string {
        if (this.highlightModifier !== 0) {
            return this.getHighlightColor();
        }
        return this.getStandardFillColor(mode);
    }

    public getStandardFillColor(mode: MapMode): string {
        switch (mode) {
            case MapMode.Terrain:
                return this.terrainColor;
            case MapMode.Political:
                return this.nation?.color ?? CellConstant.NoNation;
            default:
                const c: never = mode;
                throw new Error('Unexpected map mode' + c);
        }
    }

    public getDistanceFrom(target: Cell): number {
        const { x: thisX, y: thisY, z: thisZ } = this.posCube;
        const { x: targetX, y: targetY, z: targetZ } = target.posCube;

        return Math.max(
            Math.abs(thisX - targetX),
            Math.abs(thisY - targetY),
            Math.abs(thisZ - targetZ));
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
        this.terrainColor = CellTerrainColor.Placeholder;
    }

    public getStandardFillColor(_mode: MapMode): string {
        return this.terrainColor;
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
        this.terrainColor = CellTerrainColor.Mountain;

        this.offset = { x: OffsetColumns.Seventh, y: OffsetRows.Third };
    }
}

export class HighlandCell extends LandCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Highland);

        this.movementCost = MovementCosts.Medium;
        this.terrainColor = CellTerrainColor.Highland;

        this.offset = { x: OffsetColumns.Fifth, y: OffsetRows.Third };
    }
}

export class PlainCell extends LandCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.Plain);

        this.movementCost = MovementCosts.Easy;
        this.terrainColor = CellTerrainColor.Plain;

        this.offset = { x: OffsetColumns.First, y: OffsetRows.First };
    }
}

export class WaterCell extends Cell {
    constructor(pos: IPosition2d, type: CellTypes) {
        super(pos, type);

        this.movementCost = MovementCosts.Impossible;
        this.movementEnabled = false;
    }

    public getStandardFillColor(_mode: MapMode): string {
        return this.terrainColor;
    }
}

export class ShallowWaterCell extends WaterCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.ShallowWater);

        this.terrainColor = CellTerrainColor.ShallowWater;

        this.offset = { x: OffsetColumns.Fifth, y: OffsetRows.First };
    }
}

export class DeepWaterCell extends WaterCell {
    constructor(pos: IPosition2d) {
        super(pos, CellTypes.DeepWater);

        this.terrainColor = CellTerrainColor.DeepWater;

        this.offset = { x: OffsetColumns.Seventh, y: OffsetRows.First };
    }
}
