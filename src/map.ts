import { Cell, CellTypes, CellColor, PlaceholderCell } from './cell';
import Utils from './utils';
import { Path } from './path';
import Prando from 'prando';

import FastPriorityQueue = require('../node_modules/fastpriorityqueue/FastPriorityQueue');

export enum NeighborAlgorithms {
    Square,
    Cube,
}

enum Ranges {
    Immediate   = 1,
    Close       = 2,
    Medium      = 4,
    Far         = 8,
}

enum HexConstants {
    BonusOffsetX = 0.5,
    BonusOffsetY = 1 / 3,
    HeightFactor = 0.75,
    WidthHeightRatio = 1.1547,
    Angle = 0.523598776,
}

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

export interface IWorldMapParams {
    onCellHover?: (event: MouseEvent) => void;
    onCellClick?: (event: MouseEvent) => void;
}

export class WorldMap {
    private width: number;
    private height: number;
    private scale: number;
    private scaleIndex: number;
    private position: { x: number, y: number };

    private cellsSquare: Array<Array<Cell>>;
    private cellsCube: Map<string, Cell>;

    private rng: Prando;

    private lastMouseX: number;
    private lastMouseY: number;
    private isMouseDown: boolean;
    private isDragging: boolean;

    private readonly generationParams: IGenerationParams = {
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

    private readonly scaleThresholds = [1, 2, 4, 8, 12, 16, 20, 25, 50, 80, 100, 200, 400];

    private readonly minScaleIndex = 0;
    private readonly maxScaleIndex = this.scaleThresholds.length - 1;
    private readonly initialScaleIndex = 9;

    private readonly minRenderInterval = 50;
    private readonly hexagonThresholdScale = 10;
    private readonly textureThresholdScale = 100;

    private readonly hexagonBorderWidth = 0.1;

    private readonly placeholderCell: Cell;

    private canvas?: HTMLCanvasElement;

    private readonly sprite: HTMLImageElement;
    private readonly spriteElementWidth = 155;
    private readonly spriteElementHeight = 185;

    private getAdjCellsForSmoothing: (cell: Cell, radius: Ranges, filterTypes?: CellTypes) => Array<Cell>;
    private getAdjCellsForGenerating: (cell: Cell, radius: Ranges, filterTypes?: CellTypes) => Array<Cell>;

    private onCellHover?: (event: MouseEvent) => void;
    private onCellClick?: (event: MouseEvent) => void;

    constructor(
        width: number,
        height: number,
        generationParams: Partial<IGenerationParams> = {},
        worldMapParams: IWorldMapParams = {}
    ) {
        this.width = width;
        this.height = height;
        this.generationParams = { ...this.generationParams, ...generationParams };
        this.rng = new Prando(this.generationParams.seed);
        this.scaleIndex = this.initialScaleIndex;
        this.scale = this.scaleThresholds[this.scaleIndex];
        this.cellsSquare = [];
        this.cellsCube = new Map<string, Cell>();
        this.position = { x: 0, y: 0 };
        this.render = Utils.throttle(this.render.bind(this), this.minRenderInterval);
        this.placeholderCell = new PlaceholderCell(0, 0);

        this.getAdjCellsForSmoothing = generationParams.smoothingNeighborAlgorithm === NeighborAlgorithms.Cube ?
            this.getAdjacentCellsCube.bind(this) : this.getAdjacentCellsSquare.bind(this);
        this.getAdjCellsForGenerating = generationParams.generationNeighborAlgorithm === NeighborAlgorithms.Cube ?
            this.getAdjacentCellsCube.bind(this) : this.getAdjacentCellsSquare.bind(this);

        this.sprite = new Image();
        this.sprite.src = 'sprite.png';

        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isMouseDown = false;
        this.isDragging = false;

        this.onCellHover = worldMapParams.onCellHover;
        this.onCellClick = worldMapParams.onCellClick;

        this.generateEmptyCells();
    }

    public zoomIn(posX: number, posY: number): boolean {
        if (this.scaleIndex >= this.maxScaleIndex) return false;

        ++this.scaleIndex;
        const newScale = this.scaleThresholds[this.scaleIndex];

        let newX = this.position.x + posX / this.scale - posX / newScale;
        let newY = this.position.y + posY / this.scale - posY / newScale;

        this.scale = newScale;
        this.setPosition(newX, newY);

        return true;
    }

    public zoomOut(posX: number, posY: number): boolean {
        if (this.scaleIndex <= this.minScaleIndex) return false;

        --this.scaleIndex;
        let newScale = this.scaleThresholds[this.scaleIndex];

        let newX = this.position.x + posX / this.scale - posX / newScale;
        let newY = this.position.y + posY / this.scale - posY / newScale;

        this.scale = newScale;
        this.setPosition(newX, newY);

        return true;
    }

    public movePosition(changeX: number, changeY: number): boolean {
        let newX = this.position.x + changeX / this.scale;
        let newY = this.position.y + changeY / this.scale;

        return this.setPosition(newX, newY);
    }

    public setPosition(newX: number, newY: number): boolean {
        let lastX = this.position.x;
        let lastY = this.position.y;

        let { columnsInView, rowsInView } = this.getVisibleCellsCount();

        const bonusOffsetX = this.scale >= this.hexagonThresholdScale ? HexConstants.BonusOffsetX : 0;
        const bonusOffsetY = this.scale >= this.hexagonThresholdScale ? HexConstants.BonusOffsetY : 0;

        this.position.x = Math.max(Math.min(newX, this.width - columnsInView + bonusOffsetX), 0);
        this.position.y = Math.max(Math.min(newY, this.height - rowsInView + bonusOffsetY), 0);

        return lastX !== this.position.x || lastY !== this.position.y;
    }

    public getPosition(): { x: number, y: number } {
        return this.position;
    }

    public get size() {
        return this.width * this.height;
    }

    public generate() {
        this.generateLakes();
        this.generateMountains();
        this.smoothingPass();
        this.smoothingPass2();
        this.smoothingPass3();
        this.generatePlains();

        this.convertCells();
    }

    public initView(canvas: HTMLCanvasElement | undefined, scaleIndex: number = this.initialScaleIndex): void {
        this.canvas = canvas;
        this.scaleIndex = scaleIndex;
        this.scale = this.scaleThresholds[this.scaleIndex];

        this.canvas?.addEventListener('wheel', (event: MouseWheelEvent) => this.handleMouseWheel(event));
        this.canvas?.addEventListener('mousedown', (event: MouseEvent) => this.handleMouseDown(event));
        this.canvas?.addEventListener('mouseup', (event: MouseEvent) => this.handleMouseUp(event));
        this.canvas?.addEventListener('mousemove', (event: MouseEvent) => this.handleMouseMove(event));
        this.canvas?.addEventListener('mouseenter', (event: MouseEvent) => this.handleMouseEnter(event));
    }

    public render(): void {
        if (this.canvas === undefined) return;

        let ctx: CanvasRenderingContext2D = this.canvas.getContext('2d')!;
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.scale >= this.hexagonThresholdScale) {
            this.renderHexagonal(ctx);
        } else {
            this.renderSquare(ctx);
        }
    }

    public calculatePath(startX: number, startY: number, endX: number, endY: number): Path | undefined {
        let startCell = this.cellsSquare[startX][startY];
        let endCell = this.cellsSquare[endX][endY];

        if (!startCell.movementEnabled || !endCell.movementEnabled) {
            return undefined;
        }

        let queue = new FastPriorityQueue<{cell: Cell, priority: number}>((a, b) => a.priority < b.priority);
        queue.add({cell: startCell, priority: 0});

        let cellsMap = new Map<Cell, Cell | undefined>();
        let currCost = new Map<Cell, number>();
        cellsMap.set(startCell, undefined);
        currCost.set(startCell, 0);

        while (!queue.isEmpty()) {
            let current = queue.poll()!;
            if (current.cell === endCell) break;
            for (let next of this.getAdjacentCellsCube(current.cell, Ranges.Immediate)) {
                if (!next.movementEnabled) continue;
                let newCost = currCost.get(current.cell)! + next.movementCost;
                if (!currCost.has(next) || newCost < currCost.get(next)!) {
                    currCost.set(next, newCost);
                    let priority = newCost + next.getDistanceFrom(endCell);
                    queue.add({cell: next, priority: priority});
                    cellsMap.set(next, current.cell);
                }
            }
        }

        // backtrace the path
        let current: Cell | undefined = cellsMap.get(endCell);
        if (current === undefined) { // path not found
            return undefined;
        }

        let path: Path = new Path();
        path.add(endCell);
        do {
            path.add(current);
        } while ((current = cellsMap.get(current)) !== undefined);

        return path;
    }

    private getVisibleCellsCount(): { columnsInView: number, rowsInView: number } {
        if (this.scale < this.hexagonThresholdScale) {
            return {
                columnsInView: (this.canvas?.width ?? 0) / this.scale,
                rowsInView: (this.canvas?.height ?? 0) / this.scale,
            };
        }

        let hexRectangleWidth = this.scale;
        let hexRectangleHeight = hexRectangleWidth * HexConstants.WidthHeightRatio * HexConstants.HeightFactor;

        return {
            columnsInView: (this.canvas?.width ?? 0) / hexRectangleWidth,
            rowsInView: (this.canvas?.height ?? 0) / hexRectangleHeight / HexConstants.HeightFactor,
        };
    }

    private getCellCube(x: number, y: number, z: number): Cell | undefined {
        return this.cellsCube.get(x + '.' + y + '.' + z);
    }

    private renderSquare(ctx: CanvasRenderingContext2D): void {
        let { columnsInView, rowsInView } = this.getVisibleCellsCount();

        for (let x = Math.floor(this.position.x), i = 0; x < this.position.x + columnsInView; ++x, ++i) {
            let lastFillColor: string = '';
            let cellsInBatch = 1;
            let batchStartY = 0;
            for (let y = Math.floor(this.position.y), j = 0; y < this.position.y + rowsInView; ++y, ++j) {
                let cell = this.checkBoundaries(x, y) ? this.cellsSquare[x][y] : this.placeholderCell;
                let fillColor = cell.highlightColor !== undefined ? cell.highlightColor : cell.color;
                if (fillColor !== lastFillColor) {
                    if (lastFillColor !== CellColor.None) {
                        ctx.fillRect(i * this.scale, batchStartY, this.scale, this.scale * cellsInBatch);
                    }

                    batchStartY = j * this.scale;
                    ctx.fillStyle = fillColor;
                    lastFillColor = fillColor;
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
        let sprite = this.sprite;
        let spriteWidth = this.spriteElementWidth;
        let spriteHeight = this.spriteElementHeight;

        let hexRectangleWidth = this.scale;
        let hexRectangleHeight = hexRectangleWidth * HexConstants.WidthHeightRatio * HexConstants.HeightFactor;
        let hexRadius = hexRectangleWidth / 2;
        let sideLength = hexRadius / Math.cos(HexConstants.Angle);
        let hexHeight = sideLength / 2;

        let { columnsInView, rowsInView } = this.getVisibleCellsCount();

        ctx.lineWidth = this.hexagonBorderWidth;

        const offsetX = (this.position.x - Math.floor(this.position.x)) * this.scale;
        const offsetY = (this.position.y - Math.floor(this.position.y)) * this.scale / HexConstants.WidthHeightRatio;

        for (let x = Math.floor(this.position.x) - 1, i = -1; x < this.position.x + columnsInView + 1; ++x, ++i) {
            for (let y = Math.floor(this.position.y) - 1, j = -1; y < this.position.y + rowsInView + 1; ++y, ++j) {
                let cell = this.checkBoundaries(x, y) ? this.cellsSquare[x][y] : this.placeholderCell;
                let positionX = i * hexRectangleWidth + ((y % 2) * hexRadius) - offsetX;
                let positionY = j * hexRectangleHeight - offsetY;

                ctx.beginPath();
                ctx.moveTo(positionX + hexRadius, positionY);
                ctx.lineTo(positionX + hexRectangleWidth, positionY + hexHeight);
                ctx.lineTo(positionX + hexRectangleWidth, positionY + hexHeight * 3);
                ctx.lineTo(positionX + hexRadius, positionY + hexHeight * 4);
                ctx.lineTo(positionX, positionY + hexHeight * 3);
                ctx.lineTo(positionX, positionY + hexHeight);
                ctx.closePath();

                if (this.scale < this.textureThresholdScale) {
                    ctx.fillStyle = cell.highlightColor !== undefined ? cell.highlightColor : cell.color;
                    ctx.fill();
                } else {
                    ctx.drawImage(sprite, cell.offsetX, cell.offsetY, spriteWidth, spriteHeight,
                        positionX, positionY, hexRectangleWidth, hexHeight * 4);
                }
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
            }
        }
    }

    private generateEmptyCells() {
        for (let x = 0; x < this.width; ++x) {
            this.cellsSquare.push([]);
            for (let y = 0; y < this.height; ++y) {
                let newCell = new Cell(x, y);
                this.cellsSquare[this.cellsSquare.length - 1].push(newCell);
                this.cellsCube.set(newCell.cubeX + '.' + newCell.cubeY + '.' + newCell.cubeZ, newCell);
            }
        }
    }

    private generateLakes() {
        let seedsNumber = this.generationParams.lakeFactor * this.size;
        let cellsToProcess: Array<Cell> = [];
        let spreadFactor = this.generationParams.lakeSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            let x = this.rng.nextInt(0, this.width - 1);
            let y = this.rng.nextInt(0, this.height - 1);
            let seedCell = this.cellsSquare[x][y];

            seedCell.type = CellTypes.ShallowWater;
            cellsToProcess.push(this.cellsSquare[x][y]);
        }
        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift()!;

            let adjacentCells = this.getAdjCellsForGenerating(cell, Ranges.Close);
            adjacentCells.forEach((cell: Cell) => {
                if (cell.type !== CellTypes.None) return;

                if (this.rng.next() < spreadFactor) {
                    cell.type = CellTypes.ShallowWater;
                    cellsToProcess.push(cell);
                }
            });
        }
    }

    private generateMountains() {
        let seedsNumber = this.generationParams.mountainFactor * this.size;
        let cellsToProcess: Array<Cell> = [];
        let spreadFactor = this.generationParams.mountainSpreadFactor;

        for (let i = 0; i < seedsNumber; ++i) {
            let x = this.rng.nextInt(0, this.width - 1);
            let y = this.rng.nextInt(0, this.height - 1);
            let seedCell = this.cellsSquare[x][y];

            // prevent mountain generation right next to lakes
            if (this.getAdjCellsForGenerating(seedCell, Ranges.Immediate, CellTypes.Water).length > 0) {
                continue;
            }

            seedCell.type = CellTypes.Mountain;
            cellsToProcess.push(this.cellsSquare[x][y]);
        }

        while (cellsToProcess.length > 0) {
            let cell = cellsToProcess.shift()!;

            let adjacentCells = this.getAdjCellsForGenerating(cell, Ranges.Immediate);
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

    private generatePlains() {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            if (currentCell.type === CellTypes.None) {
                currentCell.type = CellTypes.Plain;
            }
        }));
    }

    private smoothingPass() {
        let adjacentCells: Array<Cell> = [];
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellTypes.ShallowWater:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Immediate, CellTypes.Water);
                    if (adjacentCells.length < 2) {
                        currentCell.type = CellTypes.None;
                        break;
                    }
                    break;
                case CellTypes.Highland:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Immediate, CellTypes.Mountain);
                    if (adjacentCells.length > this.generationParams.smoothingMountainFactor) {
                        currentCell.type = CellTypes.Mountain;
                    }
                    /* falls through */
                case CellTypes.Mountain:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Close, CellTypes.Water);
                    if (adjacentCells.length > 0) {
                        currentCell.type = CellTypes.None;
                    }
                    break;
                case CellTypes.None:
                    adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Close, CellTypes.Water);
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

    private smoothingPass2() {
        let adjacentCells: Array<Cell> = [];
        for (let i = 0; i < this.generationParams.waterSmoothingPasses; ++i) {
            this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
                switch (currentCell.type) {
                    case CellTypes.ShallowWater:
                        adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Immediate, CellTypes.Water);
                        if (adjacentCells.length < i + this.generationParams.waterSmoothingPass3Factor) {
                            currentCell.type = CellTypes.None;
                            break;
                        }
                        break;
                    case CellTypes.None:
                        adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Close, CellTypes.Water);
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

    private smoothingPass3() {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellTypes.ShallowWater:
                    let adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Medium);
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

    private convertCells() {
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                let newCell = this.cellsSquare[x][y].convert();

                this.cellsSquare[x][y] = newCell;
                this.cellsCube.set(newCell.cubeX + '.' + newCell.cubeY + '.' + newCell.cubeZ, newCell);
            }
        }
    }

    private getAdjacentCellsSquare(cell: Cell, radius: number, filterType?: CellTypes): Array<Cell> {
        let result: Array<Cell> = [];
        let arrayX = Utils.range(cell.posX - radius, cell.posX + radius);
        let arrayY = Utils.range(cell.posY - radius, cell.posY + radius);
        arrayX.forEach(posX => arrayY.forEach(posY => {
            // don't include source cell in result array
            if (cell.posX === posX && cell.posY === posY) return;

            let neighborCell = this.checkBoundaries(posX, posY) ? this.cellsSquare[posX][posY] : undefined;
            if (neighborCell === undefined) return;

            if (filterType === undefined || (filterType & neighborCell.type) !== 0) {
                result.push(neighborCell);
            }
        }));
        return result;
    }

    private getAdjacentCellsCube(cell: Cell, radius: number, filterType?: CellTypes): Array<Cell> {
        let result: Array<Cell> = [];
        let arrayX = Utils.range(cell.cubeX - radius, cell.cubeX + radius);
        let arrayY = Utils.range(cell.cubeY - radius, cell.cubeY + radius);
        arrayX.forEach(cubeX => arrayY.forEach(cubeY => {
            let cubeZ = -cubeX - cubeY;
            if (cell.cubeZ - cubeZ < -radius || cell.cubeZ - cubeZ > radius) return;
            // don't include source cell in result array
            if (cell.cubeX === cubeX && cell.cubeY === cubeY && cell.cubeZ === cubeZ) return;

            let neighborCell = this.getCellCube(cubeX, cubeY, cubeZ);
            if (neighborCell === undefined) return;

            if (filterType === undefined || (filterType & neighborCell.type) !== 0) {
                result.push(neighborCell);
            }
        }));
        return result;
    }

    private checkBoundaries(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    private handleMouseWheel(event: MouseWheelEvent): void {
        event.preventDefault();

        let needsRendering = false;

        let mousePos = this.getMousePos(event);
        let currentX = mousePos.x;
        let currentY = mousePos.y;

        if (event.deltaY < 0) {
            needsRendering = this.zoomIn(currentX, currentY);
        } else if (event.deltaY > 0) {
            needsRendering = this.zoomOut(currentX, currentY);
        }

        if (needsRendering) {
            this.render();
        }
    }

    private handleMouseDown(event: MouseEvent): void {
        event.preventDefault();

        let initialMousePos = this.getMousePos(event);
        this.lastMouseX = initialMousePos.x;
        this.lastMouseY = initialMousePos.y;
        this.isMouseDown = true;
        this.isDragging = false;
    }

    private handleMouseMove(event: MouseEvent): void {
        const mousePos = this.getMousePos(event);
        const currentX = mousePos.x;
        const currentY = mousePos.y;

        if (this.isMouseDown) {
            this.isDragging = true;
            this.handleMouseDrag(currentX, currentY);
        } else {
            if (this.scale < this.hexagonThresholdScale) return;

            const cell = this.findCellFromCoords(currentX, currentY);
            if (cell !== undefined) {
                this.onCellHover?.call(cell, event);
                this.render();
            }
        }
    }

    private handleMouseDrag(currentX: number, currentY: number): void {
        if (this.movePosition(this.lastMouseX - currentX, this.lastMouseY - currentY)) {
            this.render();
        }

        this.lastMouseX = currentX;
        this.lastMouseY = currentY;
    }

    private handleMouseUp(event: MouseEvent): void {
        this.isMouseDown = false;

        if (this.isDragging) {
            this.isDragging = false;

            let mousePos = this.getMousePos(event);
            let endX = mousePos.x;
            let endY = mousePos.y;

            this.handleMouseDrag(endX, endY);
        } else {
            if (this.scale < this.hexagonThresholdScale) return;

            const mousePos = this.getMousePos(event);
            const currentX = mousePos.x;
            const currentY = mousePos.y;

            const cell = this.findCellFromCoords(currentX, currentY);
            if (cell !== undefined) {
                this.onCellClick?.call(cell, event);
                this.render();
            }
        }
    }

    private handleMouseEnter(_event: MouseEvent): void {
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    // Calculate mouse position in canvas.
    // Returns same values for pixels on the canvas edges and for corresponding canvas borders
    private getMousePos(event: MouseEvent): { x: number, y: number } {
        const canvas = this.canvas;
        if (canvas === undefined) {
            return { x: 0, y: 0 };
        }
        let rect = canvas.getBoundingClientRect();
        const borderStyle = getComputedStyle(canvas, undefined);
        const topBorder = parseFloat(borderStyle.getPropertyValue('border-top-width'));
        const leftBorder = parseFloat(borderStyle.getPropertyValue('border-left-width'));
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pos = {
            x: event.clientX - leftBorder - rect.left,
            y: event.clientY - topBorder - rect.top,
        };
        return {
            x: Math.max(0, Math.min(canvasWidth - 1, pos.x)),
            y: Math.max(0, Math.min(canvasHeight - 1, pos.y)),
        };
    }

    private findCellFromCoords(x: number, y: number): Cell | undefined {
        const hexRectangleWidth = this.scale;
        const hexRectangleHeight = hexRectangleWidth * HexConstants.WidthHeightRatio * HexConstants.HeightFactor;
        const posY = Math.floor(this.position.y + y / hexRectangleHeight);
        const posX = Math.floor(this.position.x + x / hexRectangleWidth - posY % 2 / 2);
        return this.checkBoundaries(posX, posY) ? this.cellsSquare[posX][posY] : undefined;
    }
}
