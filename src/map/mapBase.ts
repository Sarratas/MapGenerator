import { Cell } from '../cell/cell';
import { IPosition2d, IPositionCube } from '../shared/position';
import Utils from '../utils';
import { CellTypes } from '../cell/cellDefines';

export enum NeighborAlgorithms {
    Square,
    Cube,
}

export enum MapRanges {
    Immediate = 1,
    Close = 2,
    Medium = 4,
    Far = 8,
}

export abstract class CellsContainer {
    protected width: number;
    protected height: number;

    protected cellsSquare: Array<Array<Cell>>;
    protected cellsCube: Map<string, Cell>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.cellsSquare = new Array(width).fill(undefined)
            .map(_ => Array(height)
                .fill(undefined));
        this.cellsCube = new Map<string, Cell>();
    }

    public get size(): number {
        return this.width * this.height;
    }

    protected getCellCube(pos: IPositionCube): Cell | undefined {
        return this.cellsCube.get(pos.x + '.' + pos.y + '.' + pos.z);
    }

    protected setCell(cell: Cell): void {
        this.cellsSquare[cell.pos.x][cell.pos.y] = cell;
        this.cellsCube.set(cell.posCube.x + '.' + cell.posCube.y + '.' + cell.posCube.z, cell);
    }

    protected checkBoundaries(pos: IPosition2d): boolean {
        return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
    }

    protected getAdjacentCellsSquare(cell: Cell, radius: number, filterType?: CellTypes): Array<Cell> {
        const result: Array<Cell> = [];
        const arrayX = Utils.range(cell.pos.x - radius, cell.pos.x + radius);
        const arrayY = Utils.range(cell.pos.y - radius, cell.pos.y + radius);
        arrayX.forEach(posX => arrayY.forEach(posY => {
            // don't include source cell in result array
            if (cell.pos.x === posX && cell.pos.y === posY) return;

            const neighborCell = this.checkBoundaries({ x: posX, y: posY }) ? this.cellsSquare[posX][posY] : undefined;
            if (neighborCell === undefined) return;

            if (filterType === undefined || (filterType & neighborCell.type) !== 0) {
                result.push(neighborCell);
            }
        }));
        return result;
    }

    protected getAdjacentCellsCube(cell: Cell, radius: number, filterType?: CellTypes): Array<Cell> {
        const result: Array<Cell> = [];
        const arrayX = Utils.range(cell.posCube.x - radius, cell.posCube.x + radius);
        const arrayY = Utils.range(cell.posCube.y - radius, cell.posCube.y + radius);
        arrayX.forEach(cubeX => arrayY.forEach(cubeY => {
            const cubeZ = -cubeX - cubeY;
            if (cell.posCube.z - cubeZ < -radius || cell.posCube.z - cubeZ > radius) return;
            // don't include source cell in result array
            if (cell.posCube.x === cubeX && cell.posCube.y === cubeY && cell.posCube.z === cubeZ) return;

            const neighborCell = this.getCellCube({ x: cubeX, y: cubeY, z: cubeZ });
            if (neighborCell === undefined) return;

            if (filterType === undefined || (filterType & neighborCell.type) !== 0) {
                result.push(neighborCell);
            }
        }));
        return result;
    }
}
