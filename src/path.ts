import { Cell } from './cell';

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
        this.cells.forEach(cell => cell.highlightColor = this.highlightColor);
    }

    public hide() {
        this.cells.forEach(cell => cell.highlightColor = undefined);
    }

    public add(cell: Cell) {
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
