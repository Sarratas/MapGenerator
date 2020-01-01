import { Cell, PlaceholderCell, PlainCell, LandCell, HighlandCell, DeepWaterCell, WaterCell, ShallowWaterCell, MountainCell } from '../cell/cell';
import { CellTypes } from '../cell/cellDefines';

test('Square cell coords', () => {
    const cell1 = new Cell({ x: 0, y: 0 });
    const cell2 = new Cell({ x: 500, y: 500 });

    expect(cell1.pos.x).toBe(0);
    expect(cell1.pos.y).toBe(0);

    expect(cell2.pos.x).toBe(500);
    expect(cell2.pos.y).toBe(500);
});

test('Cube cell coords', () => {
    const cell1 = new Cell({ x: 0, y: 0 });
    const cell2 = new Cell({ x: 0, y: 100 });
    const cell3 = new Cell({ x: 100, y: 0 });
    const cell4 = new Cell({ x: 100, y: 100 });
    const cell5 = new Cell({ x: 99, y: 99 });

    expect(cell1.posCube).toEqual({ x: 0, y: 0, z: 0 });
    expect(cell2.posCube).toEqual({ x: -50, y: -50, z: 100 });
    expect(cell3.posCube).toEqual({ x: 100, y: -100, z: 0 });
    expect(cell4.posCube).toEqual({ x: 50, y: -150, z: 100 });
    expect(cell5.posCube).toEqual({ x: 50, y: -149, z: 99 });

    expect(cell1.posCube.x + cell1.posCube.y + cell1.posCube.z).toBe(0);
    expect(cell2.posCube.x + cell2.posCube.y + cell2.posCube.z).toBe(0);
    expect(cell3.posCube.x + cell3.posCube.y + cell3.posCube.z).toBe(0);
    expect(cell4.posCube.x + cell4.posCube.y + cell4.posCube.z).toBe(0);
    expect(cell5.posCube.x + cell5.posCube.y + cell5.posCube.z).toBe(0);
});

test('Calculating distance between cells', () => {
    const cell1 = new Cell({ x: 0, y: 0 });
    const cell2 = new Cell({ x: 0, y: 0 });
    const cell3 = new Cell({ x: 0, y: 100 });
    const cell4 = new Cell({ x: 100, y: 0 });
    const cell5 = new Cell({ x: 100, y: 100 });

    expect(cell1.getDistanceFrom(cell2)).toBe(0);
    expect(cell1.getDistanceFrom(cell3)).toBe(100);
    expect(cell1.getDistanceFrom(cell4)).toBe(100);
    expect(cell1.getDistanceFrom(cell5)).toBe(150);

    expect(cell3.getDistanceFrom(cell4)).toBe(150);
    expect(cell3.getDistanceFrom(cell5)).toBe(100);

    expect(cell4.getDistanceFrom(cell5)).toBe(100);
});

test('Converting cell to None', () => {
    const cell = new Cell({ x: 0, y: 0 });

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlaceholderCell);
});

test('Converting cell to Placeholder', () => {
    const cell = new Cell({ x: 0, y: 0 });

    cell.type = CellTypes.Placeholder;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlaceholderCell);
});

test('Converting cell to ShallowWater', () => {
    const cell = new Cell({ x: 0, y: 0 });

    cell.type = CellTypes.ShallowWater;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(ShallowWaterCell);
    expect(convertedCell).toBeInstanceOf(WaterCell);
});

test('Converting cell to DeepWater', () => {
    const cell = new Cell({ x: 0, y: 0 });

    cell.type = CellTypes.DeepWater;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(DeepWaterCell);
    expect(convertedCell).toBeInstanceOf(WaterCell);
});

test('Converting cell to Plain', () => {
    const cell = new Cell({ x: 0, y: 0 });

    cell.type = CellTypes.Plain;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(PlainCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to Highland', () => {
    const cell = new Cell({ x: 0, y: 0 });

    cell.type = CellTypes.Highland;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(HighlandCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to Mountains', () => {
    const cell = new Cell({ x: 0, y: 0 });

    cell.type = CellTypes.Mountain;

    const convertedCell = cell.convert();

    expect(convertedCell).toBeInstanceOf(MountainCell);
    expect(convertedCell).toBeInstanceOf(LandCell);
});

test('Converting cell to abstract type', () => {
    const cell1 = new Cell({ x: 0, y: 0 });
    const cell2 = new Cell({ x: 0, y: 0 });

    cell1.type = CellTypes.Water;
    cell2.type = CellTypes.Land;

    expect(() => cell1.convert()).toThrow('Unexpected cell type');
    expect(() => cell2.convert()).toThrow('Unexpected cell type');
});

test('Movement disabled through water', () => {
    const cell1 = new ShallowWaterCell({ x: 0, y: 0 });
    const cell2 = new DeepWaterCell({ x: 0, y: 0 });

    expect(cell1.movementEnabled).toBe(false);
    expect(cell2.movementEnabled).toBe(false);
});

test('Movement disabled through placeholder cells', () => {
    const cell = new PlaceholderCell({ x: 0, y: 0 });

    expect(cell.movementEnabled).toBe(false);
});

test('Movement enabled through land', () => {
    const cell1 = new PlainCell({ x: 0, y: 0 });
    const cell2 = new HighlandCell({ x: 0, y: 0 });
    const cell3 = new MountainCell({ x: 0, y: 0 });

    expect(cell1.movementEnabled).toBe(true);
    expect(cell2.movementEnabled).toBe(true);
    expect(cell3.movementEnabled).toBe(true);
});

test('Movement harder through highlands and mountains', () => {
    const cell1 = new PlainCell({ x: 0, y: 0 });
    const cell2 = new HighlandCell({ x: 0, y: 0 });
    const cell3 = new MountainCell({ x: 0, y: 0 });

    expect(cell1.movementCost).toBeLessThan(cell2.movementCost);
    expect(cell1.movementCost).toBeLessThan(cell3.movementCost);
    expect(cell2.movementCost).toBeLessThan(cell3.movementCost);
});