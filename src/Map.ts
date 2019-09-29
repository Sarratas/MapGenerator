import { Cell, CellType } from "./Cell.js";
import { Utils } from "./Utils.js";

export class Map {
    private width: number;
    private height: number;
    private scale: number;
    private position: { x: number, y: number };

    private cells: Array<Array<Cell>>;

    private mountainFactor = 0.007;
    private mountainSpreadFactor = 0.45;

    private lakeFactor = 0.0001;
    private lakeSpreadFactor = 0.064;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.cells = [];
        this.position = { x: 0, y: 0 };
    }

    public zoomIn(): boolean {
        if (this.scale >= 100) return false;

        ++this.scale;
        this.movePosition(0, 0);
        return true;
    }

    public zoomOut(): boolean {
        if (this.scale <= 1) return false;

        --this.scale;
        this.movePosition(0, 0);
        return true;
    }

    public movePosition(changeX: number, changeY: number): boolean {
        let lastX = this.position.x;
        let lastY = this.position.y;

        let newX = this.position.x - changeX / this.scale;
        let newY = this.position.y - changeY / this.scale;

        this.position.x = Math.floor(Math.max(Math.min(newX, this.width - this.width / this.scale), 0));
        this.position.y = Math.floor(Math.max(Math.min(newY, this.height - this.height / this.scale), 0));

        return lastX != this.position.x || lastY != this.position.y;
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
        this.generateHighlands();
        this.smoothingPass();
        this.generatePlains();
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
                if (cell.type != CellType.None) return;

                if (Math.random() < spreadFactor) {
                    cell.type = CellType.Lake;
                    cellsToProcess.push(cell);
                } else {
                    //cell.type = CellType.Plain;
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
            if (this.getAdjacentCells(seedCell).some(cell => cell.type == CellType.Lake)) {
                continue;
            }

            seedCell.type = CellType.Mountain;
            cellsToProcess.push(this.cells[x][y]);
        }

        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift();

            let adjacentCells = this.getAdjacentCells(cell);
            adjacentCells.forEach(function(cell: Cell) {
                if (cell.type != CellType.None) return;

                if (Math.random() < spreadFactor) {
                    cell.type = CellType.Mountain;
                    cellsToProcess.push(cell);
                } else {
                    cell.type = CellType.Highland;
                }
            });
        }
    }

    private generateHighlands() {

    }

    private generatePlains() {
        this.cells.forEach(elems => elems.forEach(currentCell => {
            if (currentCell.type == CellType.None) {
                currentCell.type = CellType.Plain;
            }
        }));
    }

    private smoothingPass() {
        this.cells.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellType.Lake:
                    if (this.getAdjacentCells2(currentCell).every(cell => cell.type != CellType.Lake)) {
                        currentCell.type = CellType.None;
                        break;
                    }
                    break;
                case CellType.Highland:
                    if (this.getAdjacentCells2(currentCell).filter(cell => cell.type == CellType.Mountain).length > 5) {
                        currentCell.type = CellType.Mountain;
                    }
                    // no break;
                case CellType.Mountain:
                    if (this.getAdjacentCells2(currentCell, 2).some(cell => cell.type == CellType.Lake)) {
                        currentCell.type = CellType.None;
                    }
                    break;
                case CellType.None:
                    if (this.getAdjacentCells2(currentCell, 2).filter(cell => cell.type == CellType.Lake).length > 7) {
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
            if (cell.posX == posX && cell.posY == posY) return;

            if (posX >= 0 && posX < this.width && posY >= 0 && posY < this.height) {
                result.push(this.cells[posX][posY]);
            }
        }));
        return result;
    }

    public render(elem: HTMLCanvasElement): void {
        let ctx: CanvasRenderingContext2D = elem.getContext('2d');

        let columnsInView = this.width / this.scale;
        let rowsInView = this.height / this.scale;

        for (let x = this.position.x, i = 0; x < this.position.x + columnsInView; ++x, ++i) {
            for (let y = this.position.y, j = 0; y < this.position.y + rowsInView; ++y, ++j) {
                this.cells[x][y].render(ctx, i, j, this.scale);
            }
        }
    }
}