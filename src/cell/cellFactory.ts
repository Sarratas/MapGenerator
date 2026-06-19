import type { IPosition2d } from '../shared/position';
import { type Cell, DeepWaterCell, HighlandCell, MountainCell, PlaceholderCell, PlainCell, ShallowWaterCell } from './cell';
import { CellTypes } from './cellDefines';

export class CellFactory {
    public createCell = (pos: IPosition2d, type: CellTypes): Cell => {
        switch (type) {
            case CellTypes.Mountain:
                return new MountainCell(pos);
            case CellTypes.DeepWater:
                return new DeepWaterCell(pos);
            case CellTypes.ShallowWater:
                return new ShallowWaterCell(pos);
            case CellTypes.Plain:
                return new PlainCell(pos);
            case CellTypes.Highland:
                return new HighlandCell(pos);
            case CellTypes.None:
            case CellTypes.Placeholder:
                return new PlaceholderCell(pos);
            default:
                throw new TypeError('Unexpected cell type');
        }
    };
}
