import { WorldMap } from "../../map/worldMap";
import { Cell, PlainCell } from "../../cell/cell";
import { CellTypes } from "../../cell/cellDefines";
import { MapRanges } from "../../map/mapBase";

const mockedCells = [
    [
        new Cell({ x: 0, y: 0 }, CellTypes.Plain),
        new Cell({ x: 0, y: 1 }, CellTypes.Plain),
        new Cell({ x: 0, y: 2 }, CellTypes.Plain),
        new Cell({ x: 0, y: 3 }, CellTypes.Plain),
        new Cell({ x: 0, y: 4 }, CellTypes.Plain),
    ],
    [
        new Cell({ x: 1, y: 0 }, CellTypes.Plain),
        new Cell({ x: 1, y: 1 }, CellTypes.Highland),
        new Cell({ x: 1, y: 2 }, CellTypes.Mountain),
        new Cell({ x: 1, y: 3 }, CellTypes.Highland),
        new Cell({ x: 1, y: 4 }, CellTypes.Plain),
    ],
    [
        new Cell({ x: 2, y: 0 }, CellTypes.Plain),
        new Cell({ x: 2, y: 1 }, CellTypes.Highland),
        new Cell({ x: 2, y: 2 }, CellTypes.Mountain),
        new Cell({ x: 2, y: 3 }, CellTypes.Highland),
        new Cell({ x: 2, y: 4 }, CellTypes.Plain),
    ],
    [
        new Cell({ x: 3, y: 0 }, CellTypes.Plain),
        new Cell({ x: 3, y: 1 }, CellTypes.ShallowWater),
        new Cell({ x: 3, y: 2 }, CellTypes.DeepWater),
        new Cell({ x: 3, y: 3 }, CellTypes.ShallowWater),
        new Cell({ x: 3, y: 4 }, CellTypes.Plain),
    ],
    [
        new Cell({ x: 4, y: 0 }, CellTypes.Plain),
        new Cell({ x: 4, y: 1 }, CellTypes.Plain),
        new Cell({ x: 4, y: 2 }, CellTypes.Plain),
        new Cell({ x: 4, y: 3 }, CellTypes.Plain),
        new Cell({ x: 4, y: 4 }, CellTypes.Plain),
    ],
];

describe('Base map functionality testing', () => {
    it('Should return size of map', () => {
        const map = new WorldMap(5, 5, mockedCells);

        expect(map.size).toEqual(25);

        expect(map['cellsSquare'].length).toEqual(5);
        expect(map['cellsCube'].size).toEqual(25);
    });

    it('Should set and get cell based on cube position', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const cell = new PlainCell({ x: 4, y: 4 });

        map['setCell'](cell);

        expect(map['getCellCube'](cell.posCube)).toBe(cell);
        expect(map['cellsSquare'][cell.pos.x][cell.pos.y]).toBe(cell);
    });

    it('Should return false when out of boundaries', () => {
        const map = new WorldMap(5, 5, mockedCells);

        expect(map['checkBoundaries']({ x: 0, y: 0 })).toBeTruthy();
        expect(map['checkBoundaries']({ x: 4, y: 4 })).toBeTruthy();
        expect(map['checkBoundaries']({ x: 5, y: 5 })).toBeFalsy();
        expect(map['checkBoundaries']({ x: 100, y: 100 })).toBeFalsy();
        expect(map['checkBoundaries']({ x: -1, y: -1 })).toBeFalsy();
    });
});

describe('Adjacent cells algorithm tests', () => {
    it('Should return adjacent cells in square coords', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const cell = map['cellsSquare'][1][2];

        const adjacentCellsAll = map['getAdjacentCellsSquare'](cell, MapRanges.Immediate);
        const adjacentCellsPlain = map['getAdjacentCellsSquare'](cell, MapRanges.Immediate, CellTypes.Plain);

        expect(adjacentCellsAll.length).toEqual(8);
        expect(adjacentCellsPlain.length).toEqual(3);

        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 0, y: 1 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 0, y: 2 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 0, y: 3 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 1, y: 1 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 1, y: 3 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 2, y: 1 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 2, y: 2 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 2, y: 3 } })]));

        expect(adjacentCellsAll).not.toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 1, y: 2 } })]));

        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 0, y: 1} })]));
        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 0, y: 2 } })]));
        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 0, y: 3 } })]));
    });

    test('Adjacent cells for cube coords', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const cell = map['getCellCube']({ x: 0, y: -2, z: 2 })!;

        const adjacentCellsAll = map['getAdjacentCellsCube'](cell, MapRanges.Immediate);
        const adjacentCellsPlain = map['getAdjacentCellsCube'](cell, MapRanges.Immediate, CellTypes.Plain);

        expect(adjacentCellsAll.length).toBe(6);
        expect(adjacentCellsPlain.length).toBe(3);

        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: -1, z: 1 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: -3, z: 3 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: -1, y: -2, z: 3 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 1, y: -2, z: 1 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 1, y: -3, z: 2 } })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: -1, y: -1, z: 2 } })]));

        expect(adjacentCellsAll).not.toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: -2, z: 2 } })]));

        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: -1, z: 1 } })]));
        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: -1, y: -2, z: 3 } })]));
        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: -1, y: -1, z: 2 } })]));
    });
});