import { CellTypes } from '../../cell/cellDefines';
import { ShallowWaterCell } from '../../cell/cell';
import { NeighborAlgorithms } from '../../map/mapBase';
import { IGenerationParams, WorldMapGenerator } from '../../map/worldMapGenerator';
import { WorldMap } from '../../map/worldMap';

describe('Generator tests', () => {
    it('Should use given size', () => {
        const generator = new WorldMapGenerator();

        generator.generateEmpty(100, 100);

        expect(generator['width']).toBe(100);
        expect(generator['height']).toBe(100);
        expect(generator['size']).toBe(100 * 100);
    });

    it('Should call all generation functions once', () => {
        const generator = new WorldMapGenerator();

        generator['generateLakes'] = jest.fn();
        generator['generateMountains'] = jest.fn();
        generator['smoothingPass'] = jest.fn();
        generator['smoothingPass2'] = jest.fn();
        generator['smoothingPass3'] = jest.fn();
        generator['generatePlains'] = jest.fn();

        generator.generate(50, 50);

        expect(generator['generateLakes']).toBeCalledTimes(1);
        expect(generator['generateMountains']).toBeCalledTimes(1);
        expect(generator['smoothingPass']).toBeCalledTimes(1);
        expect(generator['smoothingPass2']).toBeCalledTimes(1);
        expect(generator['smoothingPass3']).toBeCalledTimes(1);
        expect(generator['generatePlains']).toBeCalledTimes(1);
    });

    it('Should generate map with only empty cells', () => {
        const generator = new WorldMapGenerator();

        generator.generateEmpty(50, 50);

        const cellsCount = generator['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        const emptyCellsCount = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.None).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(emptyCellsCount).toBe(50 * 50);
    });

    it('Should generate some lakes', () => {
        const generator = new WorldMapGenerator();

        generator.generateEmpty(50, 50);

        generator['generateLakes']();

        const cellsCount = generator['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        const waterCellsCount = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.ShallowWater).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(waterCellsCount).toBeGreaterThanOrEqual(generator['generationParams']['lakeFactor'] * generator.size);
    });

    it('Should generate some mountain and highland cells', () => {
        const generator = new WorldMapGenerator();

        generator.generateEmpty(50, 50);

        generator['generateMountains']();

        const cellsCount = generator['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        const mountainCellsCount = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.Mountain).length, 0);
        const highlandCellCount = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.Highland).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(mountainCellsCount).toBeGreaterThanOrEqual(generator['generationParams']['mountainFactor'] * generator.size);
        expect(highlandCellCount).toBeGreaterThanOrEqual(mountainCellsCount);
    });

    it('Should generate some plain cells', () => {
        const generator = new WorldMapGenerator();

        generator.generateEmpty(50, 50);

        generator['generatePlains']();

        const cellsCount = generator['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        const plainCellsCount = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.Plain).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(plainCellsCount).toBe(50 * 50);
    });

    it('Should generate some shallow water cells', () => {
        const generator = new WorldMapGenerator();

        generator.generateEmpty(50, 50);

        generator['cellsSquare'][1][1] = new ShallowWaterCell({ x: 1, y: 1 });

        generator['smoothingPass']();

        const waterCellsCount = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.ShallowWater).length, 0);

        expect(waterCellsCount).toBe(0);
    });

    it('Should generate map without uninitialized cells', () => {
        const generator = new WorldMapGenerator();

        generator.generate(50, 50);

        const uninitializedCells = generator['cellsSquare'].reduce((acc, elems) =>
            acc += elems.filter(cell => cell.type === CellTypes.Placeholder || cell.type === CellTypes.None).length, 0);

        expect(uninitializedCells).toBe(0);
    });

    it('Should use non-default neighbor algorithm', () => {
        const generationParams: Partial<IGenerationParams> = {
            generationNeighborAlgorithm: NeighborAlgorithms.Cube,
            smoothingNeighborAlgorithm: NeighborAlgorithms.Cube
        }

        const generator = new WorldMapGenerator(generationParams);

        generator.generateEmpty(50, 50);

        const initCell = generator['cellsSquare'][5][5];

        const adjacentCells1 = generator['getAdjCellsForGenerating'](initCell, 1);
        const adjacentCells2 = generator['getAdjCellsForSmoothing'](initCell, 1);

        expect(adjacentCells1.length).toBe(6);
        expect(adjacentCells2.length).toBe(6);
    });

    it('Should generate complete map without errors', () => {
        const generator = new WorldMapGenerator();

        expect(() => {
            generator.generate(1000, 1000);
        }).not.toThrow();
    });

    it('Should return WorldMap object', () => {
        const generator = new WorldMapGenerator();

        const map = generator.generate(50, 50);

        expect(map).toBeInstanceOf(WorldMap);
    });
});

describe('Generated map tests', () => {
    it('Should generate map with given size', () => {
        const generator = new WorldMapGenerator();

        const map = generator.generateEmpty(100, 100);

        expect(map['width']).toBe(100);
        expect(map['height']).toBe(100);
        expect(map['size']).toBe(100 * 100);
    });
});
