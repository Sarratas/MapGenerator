import { Cell, CellType } from "./Cell";
import { Utils } from "./Utils";
import FastPriorityQueue from "../node_modules/fastpriorityqueue/FastPriorityQueue";

enum NeighborAlgorithms {
    Square,
    Cube
}

enum Ranges {
    Immediate   = 1,
    Close       = 2,
    Medium      = 4,
    Far         = 8
}

export class WorldMap {
    private width: number;
    private height: number;
    private scale: number;
    private position: { x: number, y: number };

    private cellsSquare: Array<Array<Cell>>;
    private cellsCube: Map<string, Cell>;

    private readonly mountainFactor = 0.001;
    private readonly mountainSpreadFactor = 0.35;

    private readonly lakeFactor = 0.0001;
    private readonly lakeSpreadFactor = 0.064;

    private readonly smoothingMountainFactor = 5;
    private readonly smoothingLakeFactor = 11;
    private readonly waterSmoothingPasses = 3;

    private readonly minScale = 1;
    private readonly maxScale = 100;

    private readonly minRenderInterval = 50;
    private readonly hexagonThresholdScale = 10;
    private readonly textureThresholdScale = 100;

    private readonly hexagonAngle = 0.523598776;
    private readonly hexagonBorderWidth = 0.1;
    private readonly hexagonHeightFactor = 0.75;

    private readonly placeholderCell: Cell;

    private readonly sprite: HTMLImageElement;
    private readonly spriteElementWidth = 155;
    private readonly spriteElementHeight = 185;

    private readonly generationNeighborAlgorithm = NeighborAlgorithms.Square;
    private readonly smoothingNeighborAlgorithm = NeighborAlgorithms.Square;

    private getAdjacentCellsForSmoothing: (cell: Cell, radius: Ranges) => Array<Cell>;
    private getAdjacentCellsForGenerating: (cell: Cell, radius: Ranges) => Array<Cell>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.cellsSquare = [];
        this.cellsCube = new Map<string, Cell>();
        this.position = { x: 0, y: 0 };
        this.render = Utils.throttle(this.render.bind(this), this.minRenderInterval);
        this.placeholderCell = new Cell(0, 0, CellType.Placeholder);

        this.getAdjacentCellsForSmoothing = this.smoothingNeighborAlgorithm === NeighborAlgorithms.Square ?
            this.getAdjacentCellsSquare.bind(this) : this.getAdjacentCellsCube.bind(this);
        this.getAdjacentCellsForGenerating = this.generationNeighborAlgorithm === NeighborAlgorithms.Square ?
            this.getAdjacentCellsSquare.bind(this) : this.getAdjacentCellsCube.bind(this);

        this.sprite = new Image();
        this.sprite.src = "sprite.png";
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

        let { columnsInView, rowsInView } = this.countVisibleCellsCount();

        this.position.x = Math.max(Math.min(newX, this.width - columnsInView + 2), 0);
        this.position.y = Math.max(Math.min(newY, this.height - rowsInView + 2), 0);

        return lastX !== this.position.x || lastY !== this.position.y;
    }

    public get size() {
        return this.width * this.height;
    }

    public generate() {
        for (let x = 0; x < this.width; ++x) {
            this.cellsSquare.push([]);
            for (let y = 0; y < this.height; ++y) {
                let newCell = new Cell(x, y);
                this.cellsSquare[this.cellsSquare.length - 1].push(newCell);
                this.cellsCube.set(newCell.cubeX + '.' + newCell.cubeY + '.' + newCell.cubeZ, newCell);
            }
        }

        this.generateLakes();
        this.generateMountains();
        this.smoothingPass();
        this.smoothingPass2();
        this.smoothingPass3();
        this.generatePlains();
    }

    public render(elem: HTMLCanvasElement): void {
        let ctx: CanvasRenderingContext2D = elem.getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.scale >= this.hexagonThresholdScale) {
            this.renderHexagonal(ctx);
        } else {
            this.renderSquare(ctx);
        }
    }

    public calculatePath(startX: number, startY: number, endX: number, endY: number) {
        let startCell = this.cellsSquare[startX][startY];
        let endCell = this.cellsSquare[endX][endY];

        startCell.type = CellType.None;
        endCell.type = CellType.None;

        let queue = new FastPriorityQueue<{cell: Cell, priority: number}>((a, b) => a.priority < b.priority);
        queue.add({cell: startCell, priority: 0});

        let prevCell = new Map<Cell, Cell>();
        let currCost = new Map<Cell, number>();
        prevCell.set(startCell, undefined);
        currCost.set(startCell, 0);

        while (!queue.isEmpty()) {
            let current = queue.poll();
            if (current.cell === endCell) break;

            for (let next of this.getAdjacentCellsCube(current.cell, Ranges.Immediate)) {
                if (next.isMovementDisabled()) continue;
                let newCost = currCost.get(current.cell) + next.getMovementCost();
                if (!currCost.has(next) || newCost < currCost.get(next)) {
                    currCost.set(next, newCost);
                    let priority = newCost + next.getDistanceFrom(endCell);
                    queue.add({cell: next, priority: priority});
                    prevCell.set(next, current.cell);
                }
            }
        }

        // backtrace the path
        let current = endCell;
        let result: Array<Cell> = [];
        while (current !== undefined) {
            result.push(current);
            current = prevCell.get(current);
        }

        return result;
    }

    private countVisibleCellsCount(): { columnsInView: number, rowsInView: number } {
        if (this.scale < this.hexagonThresholdScale) {
            return { columnsInView: this.width / this.scale, rowsInView: this.height / this.scale };
        } else {
            let hexRectangleWidth = this.scale;
            let hexRadius = hexRectangleWidth / 2;
            let sideLength = hexRadius / Math.cos(this.hexagonAngle);
            let hexHeight = Math.sin(this.hexagonAngle) * sideLength;
            let hexRectangleHeight = sideLength + 2 * hexHeight;

            let columnsInView = this.width / hexRectangleWidth;
            let rowsInView = this.height / hexRectangleHeight / this.hexagonHeightFactor;

            return { columnsInView, rowsInView };
        }
    }

    private getCellCube(x: number, y: number, z: number) {
        return this.cellsCube.get(x + '.' + y + '.' + z);
    }

    private renderSquare(ctx: CanvasRenderingContext2D): void {
        let { columnsInView, rowsInView } = this.countVisibleCellsCount();

        for (let x = Math.floor(this.position.x), i = 0; x < this.position.x + columnsInView; ++x, ++i) {
            let lastType = CellType.None;
            let cellsInBatch = 1;
            let batchStartY = 0;
            for (let y = Math.floor(this.position.y), j = 0; y < this.position.y + rowsInView; ++y, ++j) {
                let cell = x >= 0 && y >= 0 && x < this.width && y < this.height ? this.cellsSquare[x][y] : this.placeholderCell;
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

    private renderHexagonal(ctx: CanvasRenderingContext2D): void {
        let hexRectangleWidth = this.scale;
        let hexRadius = hexRectangleWidth / 2;
        let sideLength = hexRadius / Math.cos(this.hexagonAngle);
        let hexHeight = Math.sin(this.hexagonAngle) * sideLength;
        let hexRectangleHeight = sideLength + 2 * hexHeight;

        let { columnsInView, rowsInView } = this.countVisibleCellsCount();
        
        ctx.lineWidth = this.hexagonBorderWidth;

        for (let x = Math.floor(this.position.x) - 1, i = -1; x < this.position.x + columnsInView; ++x, ++i) {
            for (let y = Math.floor(this.position.y) - 1, j = -1; y < this.position.y + rowsInView; ++y, ++j) {
                let cell = x >= 0 && y >= 0 && x < this.width && y < this.height ? this.cellsSquare[x][y] : this.placeholderCell;
                let positionX = i * hexRectangleWidth + ((y % 2) * hexRadius);
                let positionY = j * (sideLength + hexHeight);
                
                ctx.beginPath();
                ctx.moveTo(positionX + hexRadius, positionY);
                ctx.lineTo(positionX + hexRectangleWidth, positionY + hexHeight);
                ctx.lineTo(positionX + hexRectangleWidth, positionY + hexHeight + sideLength);
                ctx.lineTo(positionX + hexRadius, positionY + hexRectangleHeight);
                ctx.lineTo(positionX, positionY + sideLength + hexHeight);
                ctx.lineTo(positionX, positionY + hexHeight);
                ctx.closePath();
        
                if (this.scale < this.textureThresholdScale) {
                    ctx.fillStyle = cell.type;
                    ctx.fill();
                } else {
                    ctx.drawImage(this.sprite, cell.offsetX, cell.offsetY, this.spriteElementWidth, this.spriteElementHeight, positionX, positionY, hexRectangleWidth, hexRectangleHeight);
                }
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
            }
        }
    }

    private generateLakes() {
        let seedsNumber = this.lakeFactor * this.size;
        let cellsToProcess: Array<Cell> = [];
        let spreadFactor = this.lakeSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            let x = Utils.rand(0, this.width - 1);
            let y = Utils.rand(0, this.height - 1);
            let seedCell = this.cellsSquare[x][y];

            seedCell.setType(CellType.Water);
            cellsToProcess.push(this.cellsSquare[x][y]);
        }
        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift();

            let adjacentCells = this.getAdjacentCellsForGenerating(cell, Ranges.Close);
            adjacentCells.forEach(function(cell: Cell) {
                if (cell.type !== CellType.None) return;

                if (Math.random() < spreadFactor) {
                    cell.setType(CellType.Water);
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
            let seedCell = this.cellsSquare[x][y];

            // prevent mountain generation right next to lakes
            if (this.getAdjacentCellsForGenerating(seedCell, Ranges.Immediate).some(cell => cell.type === CellType.Water)) {
                continue;
            }

            seedCell.setType(CellType.Mountain);
            cellsToProcess.push(this.cellsSquare[x][y]);
        }

        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift();

            let adjacentCells = this.getAdjacentCellsForGenerating(cell, Ranges.Immediate);
            adjacentCells.forEach(function(cell: Cell) {
                if (cell.type !== CellType.None) return;

                if (Math.random() < spreadFactor) {
                    cell.setType(CellType.Mountain);
                    cellsToProcess.push(cell);
                } else {
                    cell.setType(CellType.Highland);
                }
            });
        }
    }

    private generatePlains() {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            if (currentCell.type === CellType.None) {
                currentCell.setType(CellType.Plain);
            }
        }));
    }

    private smoothingPass() {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellType.Water:
                    if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Immediate).filter(cell => cell.type === CellType.Water).length < 2) {
                        currentCell.setType(CellType.None);
                        break;
                    }
                    break;
                case CellType.Highland:
                    if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Immediate).filter(cell => cell.type === CellType.Mountain).length > this.smoothingMountainFactor) {
                        currentCell.setType(CellType.Mountain);
                    }
                    /* falls through */
                case CellType.Mountain:
                    if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Close).some(cell => cell.type === CellType.Water)) {
                        currentCell.setType(CellType.None);
                    }
                    break;
                case CellType.None:
                    if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Close).filter(cell => cell.type === CellType.Water).length > this.smoothingLakeFactor) {
                        currentCell.setType(CellType.Water);
                        break;
                    }
                    break;
                default:
                    break;
            }
        }));
    }

    private smoothingPass2() {
        for (let i = 0; i < this.waterSmoothingPasses; ++i) {
            this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
                switch (currentCell.type) {
                    case CellType.Water:
                        if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Immediate).filter(cell => cell.type === CellType.Water).length < i + 3) {
                            currentCell.setType(CellType.None);
                            break;
                        }
                        break;
                    case CellType.None:
                        if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Close).filter(cell => cell.type === CellType.Water).length > this.smoothingLakeFactor) {
                            currentCell.setType(CellType.Water);
                            break;
                        }
                        break;
                    default:
                        break;
                }
            }));
        }
    }

    private smoothingPass3() {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellType.Water:
                    if (this.getAdjacentCellsForSmoothing(currentCell, Ranges.Medium).every(cell => cell.type === CellType.Water || cell.type === CellType.DeepWater)) {
                        currentCell.setType(CellType.DeepWater);
                        break;
                    }
                    break;
                default:
                    break;
            }
        }));
    }

    private getAdjacentCellsSquare(cell: Cell, radius: number): Array<Cell> {
        let result: Array<Cell> = [];
        let arrayX = Utils.range(cell.posX - radius, cell.posX + radius);
        let arrayY = Utils.range(cell.posY - radius, cell.posY + radius);
        arrayX.forEach(posX => arrayY.forEach(posY => {
            // don't include source cell in result array
            if (cell.posX === posX && cell.posY === posY) return;

            if (posX >= 0 && posX < this.width && posY >= 0 && posY < this.height) {
                result.push(this.cellsSquare[posX][posY]);
            }
        }));
        return result;
    }

    private getAdjacentCellsCube(cell: Cell, radius: number): Array<Cell> {
        let result: Array<Cell> = [];
        for (let cubeX = cell.cubeX - radius; cubeX <= cell.cubeX + radius; ++cubeX) {
            for (let cubeY = cell.cubeY - radius; cubeY <= cell.cubeY + radius; ++cubeY) {
                let cubeZ = - cubeX - cubeY;
                if (cell.cubeZ - cubeZ < -radius || cell.cubeZ - cubeZ > radius) continue;
                // don't include source cell in result array
                if (cell.cubeX === cubeX && cell.cubeY === cubeY && cell.cubeZ === cubeZ) continue;
    
                let neighborCell = this.getCellCube(cubeX, cubeY, cubeZ);
                if (neighborCell != undefined)
                    result.push(neighborCell);
            }
        }
        return result;
    }
}