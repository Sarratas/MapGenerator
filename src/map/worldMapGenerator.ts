import Prando from 'prando';
import { Cell } from '../cell/cell';
import { CellTypes } from '../cell/cellDefines';
import { CellsContainer, MapRanges, NeighborAlgorithms } from './mapBase';
import { WorldMap } from './worldMap';

export interface IGenerationParams {
    mountainFactor: number;
    mountainSpreadFactor: number;

    lakeFactor: number;
    lakeSpreadFactor: number;

    smoothingMountainFactor: number;
    smoothingLakeFactor: number;
    waterSmoothingPasses: number;
    waterSmoothingPass3Factor: number;

    generationNeighborAlgorithm: NeighborAlgorithms;
    smoothingNeighborAlgorithm: NeighborAlgorithms;

    seed: string | undefined;
}

export class WorldMapGenerator extends CellsContainer {
    protected readonly generationParams: IGenerationParams = {
        mountainFactor: 0.001,
        mountainSpreadFactor: 0.35,

        lakeFactor: 0.0001,
        lakeSpreadFactor: 0.064,

        smoothingMountainFactor: 5,
        smoothingLakeFactor: 11,
        waterSmoothingPasses: 3,
        waterSmoothingPass3Factor: 3,

        generationNeighborAlgorithm: NeighborAlgorithms.Square,
        smoothingNeighborAlgorithm: NeighborAlgorithms.Square,

        seed: undefined,
    };

    protected rng: Prando;

    protected getAdjCellsForSmoothing: (cell: Cell, radius: MapRanges, filterTypes?: CellTypes) => Array<Cell>;
    protected getAdjCellsForGenerating: (cell: Cell, radius: MapRanges, filterTypes?: CellTypes) => Array<Cell>;

    constructor(generationParams: Partial<IGenerationParams> = {}) {
        super(0, 0);
        this.generationParams = { ...this.generationParams, ...generationParams };
        this.rng = new Prando(this.generationParams.seed);

        this.getAdjCellsForSmoothing = generationParams.smoothingNeighborAlgorithm === NeighborAlgorithms.Cube ?
            this.getAdjacentCellsCube.bind(this) : this.getAdjacentCellsSquare.bind(this);
        this.getAdjCellsForGenerating = generationParams.generationNeighborAlgorithm === NeighborAlgorithms.Cube ?
            this.getAdjacentCellsCube.bind(this) : this.getAdjacentCellsSquare.bind(this);
    }

    public generateEmpty(width: number, height: number): WorldMap {
        this.width = width;
        this.height = height;

        this.generateEmptyCells();

        return new WorldMap(this.width, this.height, this.cellsSquare);
    }

    public generate(width: number, height: number): WorldMap {
        this.width = width;
        this.height = height;

        this.generateEmptyCells();
        this.generateLakes();
        this.generateMountains();
        this.smoothingPass();
        this.smoothingPass2();
        this.smoothingPass3();
        this.generatePlains();

        return new WorldMap(this.width, this.height, this.cellsSquare);
    }

    protected generateEmptyCells(): void {
        for (let x = 0; x < this.width; ++x) {
            this.cellsSquare.push([]);
            for (let y = 0; y < this.height; ++y) {
                this.setCell(new Cell({ x, y }));
            }
        }
    }

    protected generateLakes(): void {
        const seedsNumber = this.generationParams.lakeFactor * this.size;
        const cellsToProcess: Array<Cell> = [];
        const spreadFactor = this.generationParams.lakeSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            const x = this.rng.nextInt(0, this.width - 1);
            const y = this.rng.nextInt(0, this.height - 1);
            const seedCell = this.cellsSquare[x][y];

            seedCell.type = CellTypes.ShallowWater;
            cellsToProcess.push(this.cellsSquare[x][y]);
        }
        while (cellsToProcess.length > 0) {
            const cell = cellsToProcess.shift()!;

            const adjacentCells = this.getAdjCellsForGenerating(cell, MapRanges.Close);
            adjacentCells.forEach((cell: Cell) => {
                if (cell.type !== CellTypes.None) return;

                if (this.rng.next() < spreadFactor) {
                    cell.type = CellTypes.ShallowWater;
                    cellsToProcess.push(cell);
                }
            });
        }
    }

    protected generateMountains(): void {
        const seedsNumber = this.generationParams.mountainFactor * this.size;
        const cellsToProcess: Array<Cell> = [];
        const spreadFactor = this.generationParams.mountainSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            const x = this.rng.nextInt(0, this.width - 1);
            const y = this.rng.nextInt(0, this.height - 1);
            const seedCell = this.cellsSquare[x][y];

            // prevent mountain generation right next to lakes
            if (this.getAdjCellsForGenerating(seedCell, MapRanges.Immediate, CellTypes.Water).length > 0) {
                continue;
            }

            seedCell.type = CellTypes.Mountain;
            cellsToProcess.push(this.cellsSquare[x][y]);
        }

        while (cellsToProcess.length > 0) {
            const cell = cellsToProcess.shift()!;

            const adjacentCells = this.getAdjCellsForGenerating(cell, MapRanges.Immediate);
            adjacentCells.forEach((cell: Cell) => {
                if (cell.type !== CellTypes.None) return;

                if (this.rng.next() < spreadFactor) {
                    cell.type = CellTypes.Mountain;
                    cellsToProcess.push(cell);
                } else {
                    cell.type = CellTypes.Highland;
                }
            });
        }
    }

    protected generatePlains(): void {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            if (currentCell.type === CellTypes.None) {
                currentCell.type = CellTypes.Plain;
            }
        }));
    }

    protected smoothingPass(): void {
        let adjacentCells: Array<Cell> = [];
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellTypes.ShallowWater:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Immediate, CellTypes.Water);
                    if (adjacentCells.length < 2) {
                        currentCell.type = CellTypes.None;
                        break;
                    }
                    break;
                case CellTypes.Highland:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Immediate, CellTypes.Mountain);
                    if (adjacentCells.length > this.generationParams.smoothingMountainFactor) {
                        currentCell.type = CellTypes.Mountain;
                    }
                /* falls through */
                case CellTypes.Mountain:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Close, CellTypes.Water);
                    if (adjacentCells.length > 0) {
                        currentCell.type = CellTypes.None;
                    }
                    break;
                case CellTypes.None:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Close, CellTypes.Water);
                    if (adjacentCells.length > this.generationParams.smoothingLakeFactor) {
                        currentCell.type = CellTypes.ShallowWater;
                        break;
                    }
                    break;
                default:
                    break;
            }
        }));
    }

    protected smoothingPass2(): void {
        let adjacentCells: Array<Cell> = [];
        for (let i = 0; i < this.generationParams.waterSmoothingPasses; ++i) {
            this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
                switch (currentCell.type) {
                    case CellTypes.ShallowWater:
                        adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Immediate, CellTypes.Water);
                        if (adjacentCells.length < i + this.generationParams.waterSmoothingPass3Factor) {
                            currentCell.type = CellTypes.None;
                            break;
                        }
                        break;
                    case CellTypes.None:
                        adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Close, CellTypes.Water);
                        if (adjacentCells.length > this.generationParams.smoothingLakeFactor) {
                            currentCell.type = CellTypes.ShallowWater;
                            break;
                        }
                        break;
                    default:
                        break;
                }
            }));
        }
    }

    protected smoothingPass3(): void {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellTypes.ShallowWater:
                    const adjacentCells = this.getAdjCellsForSmoothing(currentCell, MapRanges.Medium);
                    if (adjacentCells.every(cell => cell.type & CellTypes.Water)) {
                        currentCell.type = CellTypes.DeepWater;
                        break;
                    }
                    break;
                default:
                    break;
            }
        }));
    }
}
