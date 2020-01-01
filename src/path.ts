import { Cell } from './cell/cell';
import { HighlightModifiers } from './cell/cellDefines';

export class Path {
    private cells: Array<Cell>;
    private highlightColor: string;
    private cost: number;
    private realCost: number;

    constructor(color: string = '#000000') {
        this.highlightColor = color;
        this.cells = [];
        this.cost = 0;
        this.realCost = 0;
    }

    public show(): void {
        this.cells.forEach(cell => {
            cell.highlightColor = this.highlightColor;
            cell.highlightModifier |= HighlightModifiers.Path;
        });
    }

    public hide(): void {
        this.cells.forEach(cell => {
            cell.highlightColor = undefined;
            cell.highlightModifier &= ~HighlightModifiers.Path;
        });
    }

    public add(cell: Cell): void {
        this.cells.push(cell);
        this.cost += 1;
        this.realCost += cell.movementCost;
    }

    public getCost(): number {
        return this.cost;
    }

    public getRealCost(): number {
        return this.realCost;
    }
}
