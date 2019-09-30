import { Cell, CellType } from "./Cell.js";
import { Utils } from "./Utils.js";

export class Map {
    private width: number;
    private height: number;
    private scale: number;
    private position: { x: number, y: number };

    private cells: Array<Array<Cell>>;

    private readonly mountainFactor = 0.007;
    private readonly mountainSpreadFactor = 0.45;

    private readonly lakeFactor = 0.0001;
    private readonly lakeSpreadFactor = 0.064;

    private readonly smoothingMountainFactor = 5;
    private readonly smoothingLakeFactor = 7;

    private readonly minScale = 1;
    private readonly maxScale = 100;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.cells = [];
        this.position = { x: 0, y: 0 };
    }

    public zoomIn(): boolean {
        if (this.scale >= this.maxScale) return false;

        ++this.scale;
        this.movePosition(0, 0);
        return true;
    }

    public zoomOut(): boolean {
        if (this.scale <= this.minScale) return false;

        --this.scale;
        this.movePosition(0, 0);
        return true;
    }

    public movePosition(changeX: number, changeY: number): boolean {
        let lastX = this.position.x;
        let lastY = this.position.y;

        let newX = this.position.x - changeX / this.scale;
        let newY = this.position.y - changeY / this.scale;

        this.position.x = Math.max(Math.min(newX, this.width - this.width / this.scale), 0);
        this.position.y = Math.max(Math.min(newY, this.height - this.height / this.scale), 0);

        return lastX !== this.position.x || lastY !== this.position.y;
    }

    public get size() {
        return this.width * this.height;
    }

    public generate() {
        for (let x = 0; x < this.width; ++x) {
            this.cells.push([]);
            for (let y = 0; y < this.height; ++y) {
                this.cells[this.cells.length - 1].push(new Cell(x, y));
            }
        }
        this.generateLakes();
        this.generateMountains();
        this.smoothingPass();
        this.generatePlains();
    }

    public render(elem: HTMLCanvasElement): void {
        let ctx: CanvasRenderingContext2D = elem.getContext('2d', { alpha: false });

        let columnsInView = this.width / this.scale;
        let rowsInView = this.height / this.scale;

        for (let x = Math.floor(this.position.x), i = 0; x < this.position.x + columnsInView; ++x, ++i) {
            let lastType = CellType.None;
            let cellsInBatch = 1;
            let batchStartY = 0;
            for (let y = Math.floor(this.position.y), j = 0; y < this.position.y + rowsInView; ++y, ++j) {
                let cell = this.cells[x][y];
                if (cell.type !== lastType) {
                    if (lastType !== CellType.None) {
                        ctx.fillRect(i * this.scale, batchStartY, this.scale, this.scale * cellsInBatch);
                    }

                    batchStartY = j * this.scale;
                    ctx.fillStyle = lastType = cell.type;
                    cellsInBatch = 1;
                } else {
                    ++cellsInBatch;
                    continue;
                }
            }
            ctx.fillRect(i * this.scale, batchStartY, this.scale, this.scale * cellsInBatch);
        }
    }

    private generateLakes() {
        let seedsNumber = this.lakeFactor * this.size;
        let cellsToProcess: Array<Cell> = [];
        let spreadFactor = this.lakeSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            let x = Utils.rand(0, this.width - 1);
            let y = Utils.rand(0, this.height - 1);
            let seedCell = this.cells[x][y];

            seedCell.type = CellType.Lake;
            cellsToProcess.push(this.cells[x][y]);
        }

        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift();

            let adjacentCells = this.getAdjacentCells2(cell, 2);
            adjacentCells.forEach(function(cell: Cell) {
                if (cell.type !== CellType.None) return;

                if (Math.random() < spreadFactor) {
                    cell.type = CellType.Lake;
                    cellsToProcess.push(cell);
                }
            });
        }
    }

    private generateMountains() {
        let seedsNumber = this.mountainFactor * this.size;
        let cellsToProcess: Array<Cell> = [];
        let spreadFactor = this.mountainSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            let x = Utils.rand(0, this.width - 1);
            let y = Utils.rand(0, this.height - 1);
            let seedCell = this.cells[x][y];

            // prevent mountain generation right next to lakes
            if (this.getAdjacentCells(seedCell).some(cell => cell.type === CellType.Lake)) {
                continue;
            }

            seedCell.type = CellType.Mountain;
            cellsToProcess.push(this.cells[x][y]);
        }

        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift();

            let adjacentCells = this.getAdjacentCells(cell);
            adjacentCells.forEach(function(cell: Cell) {
                if (cell.type !== CellType.None) return;

                if (Math.random() < spreadFactor) {
                    cell.type = CellType.Mountain;
                    cellsToProcess.push(cell);
                } else {
                    cell.type = CellType.Highland;
                }
            });
        }
    }

    private generatePlains() {
        this.cells.forEach(elems => elems.forEach(currentCell => {
            if (currentCell.type === CellType.None) {
                currentCell.type = CellType.Plain;
            }
        }));
    }

    private smoothingPass() {
        this.cells.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellType.Lake:
                    if (this.getAdjacentCells2(currentCell).every(cell => cell.type !== CellType.Lake)) {
                        currentCell.type = CellType.None;
                        break;
                    }
                    break;
                case CellType.Highland:
                    if (this.getAdjacentCells2(currentCell).filter(cell => cell.type === CellType.Mountain).length > this.smoothingMountainFactor) {
                        currentCell.type = CellType.Mountain;
                    }
                    /* falls through */
                case CellType.Mountain:
                    if (this.getAdjacentCells2(currentCell, 2).some(cell => cell.type === CellType.Lake)) {
                        currentCell.type = CellType.None;
                    }
                    break;
                case CellType.None:
                    if (this.getAdjacentCells2(currentCell, 2).filter(cell => cell.type === CellType.Lake).length > this.smoothingLakeFactor) {
                        currentCell.type = CellType.Lake;
                        break;
                    }
                    break;
                default:
                    break;
            }
        }));
    }

    private getAdjacentCells(cell: Cell): Array<Cell> {
        let result: Array<Cell> = [];
        if (cell.posX > 0) {
            result.push(this.cells[cell.posX - 1][cell.posY]);
        }
        if (cell.posY > 0) {
            result.push(this.cells[cell.posX][cell.posY - 1]);
        }
        if (cell.posX < this.width - 1) {
            result.push(this.cells[cell.posX + 1][cell.posY]);
        }
        if (cell.posY < this.height - 1) {
            result.push(this.cells[cell.posX][cell.posY + 1]);
        }
        return result;
    }

    private getAdjacentCells2(cell: Cell, radius: number = 1): Array<Cell> {
        let result: Array<Cell> = [];
        let arrayX = Utils.range(cell.posX - radius, cell.posX + radius);
        let arrayY = Utils.range(cell.posY - radius, cell.posY + radius);
        arrayX.forEach(posX => arrayY.forEach(posY => {
            // don't include source cell in result array
            if (cell.posX === posX && cell.posY === posY) return;

            if (posX >= 0 && posX < this.width && posY >= 0 && posY < this.height) {
                result.push(this.cells[posX][posY]);
            }
        }));
        return result;
    }
}