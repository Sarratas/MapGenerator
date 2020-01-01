import { CellTypes, CellColor, HighlightModifiers } from '../cell/cellDefines';
import { Cell, PlaceholderCell } from '../cell/cell';
import Utils from '../utils';
import { Path } from '../path';
import Prando from 'prando';
import MouseHandlers from './mouseHandlers';
import CellHooks from '../cell/cellHooks';
import { getHoverTooltip, getSelectTooltip } from '../cell/cellTooltip';

import FastPriorityQueue = require('fastpriorityqueue');
import { IPosition2d, IPositionCube } from '../shared/position';

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

interface ICellWithPriority {
    cell: Cell;
    priority: number;
}

export class WorldMap {
    protected lastMousePos: IPosition2d;
    protected isMouseDown: boolean;
    protected isDragging: boolean;
    protected isMouseInside: boolean;

    protected handleMouseWheel!: (event: MouseWheelEvent) => void;
    protected handleMouseDown!: (event: MouseEvent) => void;
    protected handleMouseMove!: (event: MouseEvent) => void;
    protected handleMouseDrag!: (pos: IPosition2d) => void;
    protected handleMouseUp!: (event: MouseEvent) => void;
    protected handleMouseEnter!: (event: MouseEvent) => void;
    protected handleMouseLeave!: (event: MouseEvent) => void;

    protected selectedCell?: Cell;
    protected hoveredCell?: Cell;

    protected width: number;
    protected height: number;
    protected scale: number;
    protected scaleIndex: number;
    protected position: IPosition2d;

    protected cellsSquare: Array<Array<Cell>>;
    protected cellsCube: Map<string, Cell>;

    protected rng: Prando;

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

    protected readonly scaleThresholds = [1, 2, 4, 8, 12, 16, 20, 25, 50, 80, 100, 200, 400];

    protected readonly minScaleIndex = 0;
    protected readonly maxScaleIndex = this.scaleThresholds.length - 1;
    protected readonly initialScaleIndex = 9;

    protected readonly minRenderInterval = 50;
    protected readonly hexagonThresholdScale = 10;
    protected readonly textureThresholdScale = 100;

    protected readonly hexagonBorderWidth = 0.1;

    protected readonly placeholderCell: Cell;

    protected canvas?: HTMLCanvasElement;

    protected readonly sprite: HTMLImageElement;
    protected readonly spriteElementWidth = 155;
    protected readonly spriteElementHeight = 185;

    protected getAdjCellsForSmoothing: (cell: Cell, radius: Ranges, filterTypes?: CellTypes) => Array<Cell>;
    protected getAdjCellsForGenerating: (cell: Cell, radius: Ranges, filterTypes?: CellTypes) => Array<Cell>;

    protected onCellHoverIn?: (event: MouseEvent) => void;
    protected onCellHoverOut?: (event: MouseEvent) => void;
    protected onCellSelect?: (event: MouseEvent) => void;
    protected onCellDeselect?: (event: MouseEvent) => void;

    constructor(
        width: number,
        height: number,
        generationParams: Partial<IGenerationParams> = {},
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
        this.placeholderCell = new PlaceholderCell({ x: 0, y: 0 });

        this.getAdjCellsForSmoothing = generationParams.smoothingNeighborAlgorithm === NeighborAlgorithms.Cube ?
            this.getAdjacentCellsCube.bind(this) : this.getAdjacentCellsSquare.bind(this);
        this.getAdjCellsForGenerating = generationParams.generationNeighborAlgorithm === NeighborAlgorithms.Cube ?
            this.getAdjacentCellsCube.bind(this) : this.getAdjacentCellsSquare.bind(this);

        this.sprite = new Image();
        this.sprite.src = 'sprite.png';

        this.lastMousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isDragging = false;
        this.isMouseInside = false;

        this.onCellHoverIn = CellHooks.onCellHoverIn;
        this.onCellHoverOut = CellHooks.onCellHoverOut;
        this.onCellSelect = CellHooks.onCellSelect;
        this.onCellDeselect = CellHooks.onCellDeselect;

        this.setAndBindMouseHandlers();

        this.generateEmptyCells();
    }

    public zoomIn(pos: IPosition2d): boolean {
        if (this.scaleIndex >= this.maxScaleIndex) return false;

        ++this.scaleIndex;
        const newScale = this.scaleThresholds[this.scaleIndex];

        const newX = this.position.x + pos.x / this.scale - pos.x / newScale;
        const newY = this.position.y + pos.y / this.scale - pos.y / newScale;

        this.scale = newScale;
        this.setPosition({ x: newX, y: newY });

        return true;
    }

    public zoomOut(pos: IPosition2d): boolean {
        if (this.scaleIndex <= this.minScaleIndex) return false;

        --this.scaleIndex;
        const newScale = this.scaleThresholds[this.scaleIndex];

        const newX = this.position.x + pos.x / this.scale - pos.x / newScale;
        const newY = this.position.y + pos.y / this.scale - pos.y / newScale;

        if (newScale < this.hexagonThresholdScale) {
            getHoverTooltip().hidden = true;
            getSelectTooltip().hidden = true;
        }

        this.scale = newScale;
        this.setPosition({ x: newX, y: newY });

        return true;
    }

    public movePosition(changeX: number, changeY: number): boolean {
        const newX = this.position.x + changeX / this.scale;
        const newY = this.position.y + changeY / this.scale;

        return this.setPosition({ x: newX, y: newY });
    }

    public setPosition(pos: IPosition2d): boolean {
        const { x: newX, y: newY } = pos;
        const { x: lastX, y: lastY } = this.position;

        const { columnsInView, rowsInView } = this.getVisibleCellsCount();

        const bonusOffsetX = this.scale >= this.hexagonThresholdScale ? HexConstants.BonusOffsetX : 0;
        const bonusOffsetY = this.scale >= this.hexagonThresholdScale ? HexConstants.BonusOffsetY : 0;

        this.position.x = Math.max(Math.min(newX, this.width - columnsInView + bonusOffsetX), 0);
        this.position.y = Math.max(Math.min(newY, this.height - rowsInView + bonusOffsetY), 0);

        return lastX !== this.position.x || lastY !== this.position.y;
    }

    public getPosition(): IPosition2d {
        return this.position;
    }

    public get size(): number {
        return this.width * this.height;
    }

    public generate(): void {
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

        this.canvas?.addEventListener('wheel', this.handleMouseWheel);
        this.canvas?.addEventListener('mousedown', this.handleMouseDown);
        this.canvas?.addEventListener('mouseup', this.handleMouseUp);
        this.canvas?.addEventListener('mousemove', this.handleMouseMove);
        this.canvas?.addEventListener('mouseenter', this.handleMouseEnter);
        this.canvas?.addEventListener('mouseleave', this.handleMouseLeave);

        this.positionTooltips();
    }

    public unbindView(): void {
        this.canvas?.removeEventListener('wheel', this.handleMouseWheel);
        this.canvas?.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas?.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas?.removeEventListener('mouseenter', this.handleMouseEnter);
        this.canvas?.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    public render(): void {
        if (this.canvas === undefined) return;

        const ctx: CanvasRenderingContext2D = this.canvas.getContext('2d')!;
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.scale >= this.hexagonThresholdScale) {
            this.renderHexagonal(ctx);
        } else {
            this.renderSquare(ctx);
        }
    }

    public calculatePath(startX: number, startY: number, endX: number, endY: number): Path | undefined {
        const startCell = this.cellsSquare[startX][startY];
        const endCell = this.cellsSquare[endX][endY];

        if (!startCell.movementEnabled || !endCell.movementEnabled) {
            return undefined;
        }

        const queue = new FastPriorityQueue<ICellWithPriority>(this.priorityComparator);
        queue.add({cell: startCell, priority: 0});

        const cellsMap = new Map<Cell, Cell | undefined>();
        const currCost = new Map<Cell, number>();
        cellsMap.set(startCell, undefined);
        currCost.set(startCell, 0);

        while (!queue.isEmpty()) {
            const current = queue.poll()!;
            if (current.cell === endCell) break;
            for (const next of this.getAdjacentCellsCube(current.cell, Ranges.Immediate)) {
                if (!next.movementEnabled) continue;
                const newCost = currCost.get(current.cell)! + next.movementCost;
                if (!currCost.has(next) || newCost < currCost.get(next)!) {
                    currCost.set(next, newCost);
                    const cost = newCost + next.getDistanceFrom(endCell);
                    queue.add({ cell: next, priority: cost });
                    cellsMap.set(next, current.cell);
                }
            }
        }

        // backtrace the path
        let current: Cell | undefined = cellsMap.get(endCell);
        if (current === undefined) { // path not found
            return undefined;
        }

        const path: Path = new Path();
        path.add(endCell);
        do {
            path.add(current);
        } while ((current = cellsMap.get(current)) !== undefined);

        return path;
    }

    protected priorityComparator = (a: ICellWithPriority, b: ICellWithPriority): boolean => {
        return a.priority < b.priority;
    }

    protected positionTooltips(): void {
        const hoverTooltip = getHoverTooltip();
        const selectTooltip = getSelectTooltip();

        hoverTooltip.hidden = false;
        const canvasRect = this.canvas!.getBoundingClientRect();
        const tooltipLeft = canvasRect.left + this.canvas!.offsetWidth - hoverTooltip.offsetWidth;
        const tooltipTop = canvasRect.top + this.canvas!.offsetHeight - hoverTooltip.offsetHeight;
        hoverTooltip.hidden = true;
        hoverTooltip.style.left = tooltipLeft + 'px';
        hoverTooltip.style.top = tooltipTop + 'px';

        selectTooltip.style.left = tooltipLeft + 'px';
        selectTooltip.style.top = canvasRect.top + 'px';
    }

    protected getVisibleCellsCount(): { columnsInView: number, rowsInView: number } {
        if (this.scale < this.hexagonThresholdScale) {
            return {
                columnsInView: (this.canvas?.width ?? 0) / this.scale,
                rowsInView: (this.canvas?.height ?? 0) / this.scale,
            };
        }

        const hexRectangleWidth = this.scale;
        const hexRectangleHeight = hexRectangleWidth * HexConstants.WidthHeightRatio * HexConstants.HeightFactor;

        return {
            columnsInView: (this.canvas?.width ?? 0) / hexRectangleWidth,
            rowsInView: (this.canvas?.height ?? 0) / hexRectangleHeight,
        };
    }

    protected getCellCube(pos: IPositionCube): Cell | undefined {
        return this.cellsCube.get(pos.x + '.' + pos.y + '.' + pos.z);
    }

    protected renderSquare(ctx: CanvasRenderingContext2D): void {
        const { columnsInView, rowsInView } = this.getVisibleCellsCount();

        for (let x = Math.floor(this.position.x), i = 0; x < this.position.x + columnsInView; ++x, ++i) {
            let lastFillColor: string = '';
            let cellsInBatch = 1;
            let batchStartY = 0;
            for (let y = Math.floor(this.position.y), j = 0; y < this.position.y + rowsInView; ++y, ++j) {
                const cell = this.checkBoundaries({ x, y }) ? this.cellsSquare[x][y] : this.placeholderCell;
                const fillColor = (cell.highlightModifier & HighlightModifiers.Path) !== 0 ?
                    cell.getHighlightColor() : cell.color;
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

    protected renderHexagonal(ctx: CanvasRenderingContext2D): void {
        const sprite = this.sprite;
        const spriteWidth = this.spriteElementWidth;
        const spriteHeight = this.spriteElementHeight;

        const hexRectangleWidth = this.scale;
        const hexRectangleHeight = hexRectangleWidth * HexConstants.WidthHeightRatio * HexConstants.HeightFactor;
        const hexRadius = hexRectangleWidth / 2;
        const sideLength = hexRadius / Math.cos(HexConstants.Angle);
        const hexHeight = sideLength / 2;

        const { columnsInView, rowsInView } = this.getVisibleCellsCount();

        ctx.lineWidth = this.hexagonBorderWidth;

        const offsetX = (this.position.x - Math.floor(this.position.x)) * this.scale;
        const offsetY = (this.position.y - Math.floor(this.position.y)) * this.scale / HexConstants.WidthHeightRatio;

        for (let x = Math.floor(this.position.x) - 1, i = -1; x < this.position.x + columnsInView + 1; ++x, ++i) {
            for (let y = Math.floor(this.position.y) - 1, j = -1; y < this.position.y + rowsInView + 1; ++y, ++j) {
                const cell = this.checkBoundaries({ x, y }) ? this.cellsSquare[x][y] : this.placeholderCell;
                const positionX = i * hexRectangleWidth + ((y % 2) * hexRadius) - offsetX;
                const positionY = j * hexRectangleHeight - offsetY;

                ctx.beginPath();
                ctx.moveTo(positionX + hexRadius, positionY);
                ctx.lineTo(positionX + hexRectangleWidth, positionY + hexHeight);
                ctx.lineTo(positionX + hexRectangleWidth, positionY + hexHeight * 3);
                ctx.lineTo(positionX + hexRadius, positionY + hexHeight * 4);
                ctx.lineTo(positionX, positionY + hexHeight * 3);
                ctx.lineTo(positionX, positionY + hexHeight);
                ctx.closePath();

                if (this.scale < this.textureThresholdScale) {
                    ctx.fillStyle = cell.highlightModifier !== 0 ? cell.getHighlightColor() : cell.color;
                    ctx.fill();
                } else {
                    ctx.drawImage(sprite, cell.offset.x, cell.offset.y, spriteWidth, spriteHeight,
                        positionX, positionY, hexRectangleWidth, hexHeight * 4);
                }
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
            }
        }
    }

    protected generateEmptyCells(): void {
        for (let x = 0; x < this.width; ++x) {
            this.cellsSquare.push([]);
            for (let y = 0; y < this.height; ++y) {
                const newCell = new Cell({ x, y });
                this.cellsSquare[this.cellsSquare.length - 1].push(newCell);
                this.cellsCube.set(newCell.posCube.x + '.' + newCell.posCube.y + '.' + newCell.posCube.z, newCell);
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

            const adjacentCells = this.getAdjCellsForGenerating(cell, Ranges.Close);
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
            if (this.getAdjCellsForGenerating(seedCell, Ranges.Immediate, CellTypes.Water).length > 0) {
                continue;
            }

            seedCell.type = CellTypes.Mountain;
            cellsToProcess.push(this.cellsSquare[x][y]);
        }

        while (cellsToProcess.length > 0) {
            const cell = cellsToProcess.shift()!;

            const adjacentCells = this.getAdjCellsForGenerating(cell, Ranges.Immediate);
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

    protected smoothingPass2(): void {
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

    protected smoothingPass3(): void {
        this.cellsSquare.forEach(elems => elems.forEach(currentCell => {
            switch (currentCell.type) {
                case CellTypes.ShallowWater:
                    const adjacentCells = this.getAdjCellsForSmoothing(currentCell, Ranges.Medium);
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

    protected convertCells(): void {
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                const newCell = this.cellsSquare[x][y].convert();

                this.cellsSquare[x][y] = newCell;
                this.cellsCube.set(newCell.posCube.x + '.' + newCell.posCube.y + '.' + newCell.posCube.z, newCell);
            }
        }
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

    protected checkBoundaries(pos: IPosition2d): boolean {
        return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
    }

    // Calculate mouse position in canvas.
    // Returns same values for pixels on the canvas edges and for corresponding canvas borders
    protected getMousePos(event: MouseEvent): IPosition2d {
        const canvas = this.canvas;
        if (canvas === undefined) {
            return { x: 0, y: 0 };
        }
        const rect = canvas.getBoundingClientRect();
        const borderStyle = getComputedStyle(canvas, undefined);
        const topBorder = parseFloat(borderStyle.getPropertyValue('border-top-width'));
        const leftBorder = parseFloat(borderStyle.getPropertyValue('border-left-width'));
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pos: IPosition2d = {
            x: event.clientX - leftBorder - rect.left,
            y: event.clientY - topBorder - rect.top,
        };
        return {
            x: Math.max(0, Math.min(canvasWidth - 1, pos.x)),
            y: Math.max(0, Math.min(canvasHeight - 1, pos.y)),
        };
    }

    protected findCellFromPos({ x, y }: IPosition2d): Cell | undefined {
        const hexRectangleWidth = this.scale;
        const hexRectangleHeight = hexRectangleWidth * HexConstants.WidthHeightRatio * HexConstants.HeightFactor;
        const posY = Math.floor(this.position.y + y / hexRectangleHeight);
        const posX = Math.floor(this.position.x + x / hexRectangleWidth - posY % 2 / 2);
        return this.checkBoundaries({ x: posX, y: posY }) ? this.cellsSquare[posX][posY] : undefined;
    }

    private setAndBindMouseHandlers(): void {
        this.handleMouseWheel = MouseHandlers.handleMouseWheel.bind(this);
        this.handleMouseDown = MouseHandlers.handleMouseDown.bind(this);
        this.handleMouseMove = Utils.throttle(MouseHandlers.handleMouseMove.bind(this), 50);
        this.handleMouseDrag = MouseHandlers.handleMouseDrag.bind(this);
        this.handleMouseUp = MouseHandlers.handleMouseUp.bind(this);
        this.handleMouseEnter = MouseHandlers.handleMouseEnter.bind(this);
        this.handleMouseLeave = MouseHandlers.handleMouseLeave.bind(this);
    }
}
