import { PlaceholderCell, ShallowWaterCell, DeepWaterCell, PlainCell, HighlandCell, MountainCell } from '../../cell/cell';
import { CellTypes } from '../../cell/cellDefines';
import { CellFactory } from '../../cell/cellFactory';

describe('Create cell with different types', () => {
    it('Should create placeholder cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.None);

        expect(cell).toBeInstanceOf(PlaceholderCell);
    });

    it('Should create plain cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.Plain);

        expect(cell).toBeInstanceOf(PlainCell);
    });

    test('Should create highland cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.Highland);

        expect(cell).toBeInstanceOf(HighlandCell);
    });

    test('Should create mountain cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.Mountain);

        expect(cell).toBeInstanceOf(MountainCell);
    });

    test('Should create shallow water cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.ShallowWater);

        expect(cell).toBeInstanceOf(ShallowWaterCell);
    });

    test('Should create deep water cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.DeepWater);

        expect(cell).toBeInstanceOf(DeepWaterCell);
    });

    test('Should create placeholder cell', () => {
        const cellFactory = new CellFactory();

        const cell = cellFactory.createCell({ x: 0, y: 0 }, CellTypes.Placeholder);

        expect(cell).toBeInstanceOf(PlaceholderCell);
    });

    test('Should throw on abstract land cell', () => {
        const cellFactory = new CellFactory();

        expect(() => {
            cellFactory.createCell({ x: 0, y: 0 }, CellTypes.Land);
        }).toThrow();
        
    });

    test('Should throw on abstract water cell', () => {
        const cellFactory = new CellFactory();

        expect(() => {
            cellFactory.createCell({ x: 0, y: 0 }, CellTypes.Water);
        }).toThrow();
    });
});
