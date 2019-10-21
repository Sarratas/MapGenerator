import { Cell, CellTypes, CellColor, PlaceholderCell, PlainCell, LandCell, HighlandCell, DeepWaterCell, WaterCell, ShallowWaterCell, MountainCell } from '../cell';

test('Square cell coords', () => {
    let cell1 = new Cell(0, 0);
    let cell2 = new Cell(500, 500);

    expect(cell1.posX).toBe(0);
    expect(cell1.posY).toBe(0);

    expect(cell2.posX).toBe(500);
    expect(cell2.posY).toBe(500);
});

test('Cube cell coords', () => {
    let cell1 = new Cell(0, 0);
    let cell2 = new Cell(0, 100);
    let cell3 = new Cell(100, 0);
    let cell4 = new Cell(100, 100);
    let cell5 = new Cell(99, 99);

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
});

test('Calculating distance between cells', () => {
    let cell1 = new Cell(0, 0);
    let cell2 = new Cell(0, 0);
    let cell3 = new Cell(0, 100);
    let cell4 = new Cell(100, 0);
    let cell5 = new Cell(100, 100);

    expect(cell1.getDistanceFrom(cell2)).toBe(0);
    expect(cell1.getDistanceFrom(cell3)).toBe(100);
    expect(cell1.getDistanceFrom(cell4)).toBe(100);
    expect(cell1.getDistanceFrom(cell5)).toBe(150);

    expect(cell3.getDistanceFrom(cell4)).toBe(150);
    expect(cell3.getDistanceFrom(cell5)).toBe(100);

    expect(cell4.getDistanceFrom(cell5)).toBe(100);
});

test('Converting cell to None', () => {
    let cell = new Cell(0, 0);

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlaceholderCell);
});

test('Converting cell to Placeholder', () => {
    let cell = new Cell(0, 0);

    cell.type = CellTypes.Placeholder;

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlaceholderCell);
});

test('Converting cell to ShallowWater', () => {
    let cell = new Cell(0, 0);

    cell.type = CellTypes.ShallowWater;

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(ShallowWaterCell);
    expect(convertedCell).toBeInstanceOf(WaterCell);
});

test('Converting cell to DeepWater', () => {
    let cell = new Cell(0, 0);

    cell.type = CellTypes.DeepWater;

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(DeepWaterCell);
    expect(convertedCell).toBeInstanceOf(WaterCell);
});

test('Converting cell to Plain', () => {
    let cell = new Cell(0, 0);

    cell.type = CellTypes.Plain;

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlainCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to Highland', () => {
    let cell = new Cell(0, 0);

    cell.type = CellTypes.Highland;

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(HighlandCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to Mountains', () => {
    let cell = new Cell(0, 0);

    cell.type = CellTypes.Mountain;

    let convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(MountainCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to abstract type', () => {
    let cell1 = new Cell(0, 0);
    let cell2 = new Cell(0, 0);

    cell1.type = CellTypes.Water;
    cell2.type = CellTypes.Land;

    expect(() => cell1.convert()).toThrow('Unexpected cell type');
    expect(() => cell2.convert()).toThrow('Unexpected cell type');
});

test('Movement disabled through water', () => {
    let cell1 = new ShallowWaterCell(0, 0);
    let cell2 = new DeepWaterCell(0, 0);

    expect(cell1.movementEnabled).toBe(false);
    expect(cell2.movementEnabled).toBe(false);
});

test('Movement disabled through placeholder cells', () => {
    let cell = new PlaceholderCell(0, 0);

    expect(cell.movementEnabled).toBe(false);
});

test('Movement enabled through land', () => {
    let cell1 = new PlainCell(0, 0);
    let cell2 = new HighlandCell(0, 0);
    let cell3 = new MountainCell(0, 0);

    expect(cell1.movementEnabled).toBe(true);
    expect(cell2.movementEnabled).toBe(true);
    expect(cell3.movementEnabled).toBe(true);
});

test('Movement harder through highlands and mountains', () => {
    let cell1 = new PlainCell(0, 0);
    let cell2 = new HighlandCell(0, 0);
    let cell3 = new MountainCell(0, 0);

    expect(cell1.movementCost).toBeLessThan(cell2.movementCost);
    expect(cell1.movementCost).toBeLessThan(cell3.movementCost);
    expect(cell2.movementCost).toBeLessThan(cell3.movementCost);
});