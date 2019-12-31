import { Cell, PlaceholderCell, PlainCell, LandCell, HighlandCell, DeepWaterCell, WaterCell, ShallowWaterCell, MountainCell } from '../cell/cell';
import { CellTypes } from '../cell/cellDefines';

test('Square cell coords', () => {
    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(500, 500);

    expect(cell1.posX).toBe(0);
    expect(cell1.posY).toBe(0);

    expect(cell2.posX).toBe(500);
    expect(cell2.posY).toBe(500);
});

test('Cube cell coords', () => {
    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(0, 100);
    const cell3 = new Cell(100, 0);
    const cell4 = new Cell(100, 100);
    const cell5 = new Cell(99, 99);

    expect(cell1.cubeX).toBe(0);
    expect(cell1.cubeY).toBe(0);
    expect(cell1.cubeZ).toBe(0);

    expect(cell2.cubeX).toBe(-50);
    expect(cell2.cubeY).toBe(-50);
    expect(cell2.cubeZ).toBe(100);

    expect(cell3.cubeX).toBe(100);
    expect(cell3.cubeY).toBe(-100);
    expect(cell3.cubeZ).toBe(0);

    expect(cell4.cubeX).toBe(50);
    expect(cell4.cubeY).toBe(-150);
    expect(cell4.cubeZ).toBe(100);

    expect(cell5.cubeX).toBe(50);
    expect(cell5.cubeY).toBe(-149);
    expect(cell5.cubeZ).toBe(99);

    expect(cell1.cubeX + cell1.cubeY + cell1.cubeZ).toBe(0);
    expect(cell2.cubeX + cell2.cubeY + cell2.cubeZ).toBe(0);
    expect(cell3.cubeX + cell3.cubeY + cell3.cubeZ).toBe(0);
    expect(cell4.cubeX + cell4.cubeY + cell4.cubeZ).toBe(0);
    expect(cell5.cubeX + cell5.cubeY + cell5.cubeZ).toBe(0);
});

test('Calculating distance between cells', () => {
    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(0, 0);
    const cell3 = new Cell(0, 100);
    const cell4 = new Cell(100, 0);
    const cell5 = new Cell(100, 100);

    expect(cell1.getDistanceFrom(cell2)).toBe(0);
    expect(cell1.getDistanceFrom(cell3)).toBe(100);
    expect(cell1.getDistanceFrom(cell4)).toBe(100);
    expect(cell1.getDistanceFrom(cell5)).toBe(150);

    expect(cell3.getDistanceFrom(cell4)).toBe(150);
    expect(cell3.getDistanceFrom(cell5)).toBe(100);

    expect(cell4.getDistanceFrom(cell5)).toBe(100);
});

test('Converting cell to None', () => {
    const cell = new Cell(0, 0);

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlaceholderCell);
});

test('Converting cell to Placeholder', () => {
    const cell = new Cell(0, 0);

    cell.type = CellTypes.Placeholder;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlaceholderCell);
});

test('Converting cell to ShallowWater', () => {
    const cell = new Cell(0, 0);

    cell.type = CellTypes.ShallowWater;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(ShallowWaterCell);
    expect(convertedCell).toBeInstanceOf(WaterCell);
});

test('Converting cell to DeepWater', () => {
    const cell = new Cell(0, 0);

    cell.type = CellTypes.DeepWater;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(DeepWaterCell);
    expect(convertedCell).toBeInstanceOf(WaterCell);
});

test('Converting cell to Plain', () => {
    const cell = new Cell(0, 0);

    cell.type = CellTypes.Plain;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlainCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to Highland', () => {
    const cell = new Cell(0, 0);

    cell.type = CellTypes.Highland;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(HighlandCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to Mountains', () => {
    const cell = new Cell(0, 0);

    cell.type = CellTypes.Mountain;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(MountainCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to abstract type', () => {
    const cell1 = new Cell(0, 0);
    const cell2 = new Cell(0, 0);

    cell1.type = CellTypes.Water;
    cell2.type = CellTypes.Land;

    expect(() => cell1.convert()).toThrow('Unexpected cell type');
    expect(() => cell2.convert()).toThrow('Unexpected cell type');
});

test('Movement disabled through water', () => {
    const cell1 = new ShallowWaterCell(0, 0);
    const cell2 = new DeepWaterCell(0, 0);

    expect(cell1.movementEnabled).toBe(false);
    expect(cell2.movementEnabled).toBe(false);
});

test('Movement disabled through placeholder cells', () => {
    const cell = new PlaceholderCell(0, 0);

    expect(cell.movementEnabled).toBe(false);
});

test('Movement enabled through land', () => {
    const cell1 = new PlainCell(0, 0);
    const cell2 = new HighlandCell(0, 0);
    const cell3 = new MountainCell(0, 0);

    expect(cell1.movementEnabled).toBe(true);
    expect(cell2.movementEnabled).toBe(true);
    expect(cell3.movementEnabled).toBe(true);
});

test('Movement harder through highlands and mountains', () => {
    const cell1 = new PlainCell(0, 0);
    const cell2 = new HighlandCell(0, 0);
    const cell3 = new MountainCell(0, 0);

    expect(cell1.movementCost).toBeLessThan(cell2.movementCost);
    expect(cell1.movementCost).toBeLessThan(cell3.movementCost);
    expect(cell2.movementCost).toBeLessThan(cell3.movementCost);
});