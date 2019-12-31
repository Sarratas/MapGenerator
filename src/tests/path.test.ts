import { Path } from '../path';
import { Cell, MountainCell, PlainCell, HighlandCell, ShallowWaterCell } from '../cell/cell';

test('Add element to path', () => {
    const path = new Path();

    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(1, 1);

    path.add(cell1);
    expect(path.getCost()).toBe(1);

    path.add(cell2);
    expect(path.getCost()).toBe(2);
});

test('Calculating path real cost', () => {
    const path1 = new Path();
    const path2 = new Path();
    const path3 = new Path();
    const path4 = new Path();
    const path5 = new Path();

    const cell1 = new PlainCell(0, 0);
    const cell2 = new MountainCell(0, 0);
    const cell3 = new HighlandCell(0, 0);
    const cell4 = new ShallowWaterCell(0, 0);

    path1.add(cell1);

    path2.add(cell2);

    path3.add(cell3);

    path4.add(cell1);
    path4.add(cell2);
    path4.add(cell2);
    path4.add(cell3);
    path4.add(cell3);
    path4.add(cell3);

    path5.add(cell1);
    path5.add(cell4);

    expect(path1.getCost()).toBe(1);
    expect(path1.getRealCost()).toBe(cell1.movementCost);

    expect(path2.getCost()).toBe(1);
    expect(path2.getRealCost()).toBe(cell2.movementCost);

    expect(path3.getCost()).toBe(1);
    expect(path3.getRealCost()).toBe(cell3.movementCost);

    expect(path4.getCost()).toBe(6);
    expect(path4.getRealCost()).toBe(cell1.movementCost + 2 * cell2.movementCost + 3 * cell3.movementCost);

    expect(path5.getCost()).toBe(2);
    expect(path5.getRealCost()).toBe(Infinity);
});

test('Highlighting path with default color', () => {
    const path = new Path();

    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(0, 0);

    path.add(cell1);
    path.add(cell2);

    expect(cell1.highlightColor).toBeUndefined();
    expect(cell2.highlightColor).toBeUndefined();

    path.show();

    expect(cell1.highlightColor).toBe('#000000');
    expect(cell2.highlightColor).toBe('#000000');

    path.hide();

    expect(cell1.highlightColor).toBeUndefined();
    expect(cell2.highlightColor).toBeUndefined();
});

test('Highlighting path with specified color', () => {
    const color = '#FFFFFF';
    const path = new Path(color);

    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(0, 0);

    path.add(cell1);
    path.add(cell2);

    expect(cell1.highlightColor).toBeUndefined();
    expect(cell2.highlightColor).toBeUndefined();

    path.show();

    expect(cell1.highlightColor).toBe(color);
    expect(cell2.highlightColor).toBe(color);

    path.hide();

    expect(cell1.highlightColor).toBeUndefined();
    expect(cell2.highlightColor).toBeUndefined();
});
