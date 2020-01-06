import { Cell, PlaceholderCell, PlainCell, HighlandCell, DeepWaterCell, ShallowWaterCell, MountainCell } from '../../cell/cell';
import { HighlightModifiers, HighlightColors, CellTerrainColor, CellConstant } from '../../cell/cellDefines';
import { MapMode } from '../../map/worldMap';
import { Nation } from '../../map/nation';

describe('Cell coords tests', () => {
    it('Should have square position set correctly', () => {
        const cell1 = new Cell({ x: 0, y: 0 });
        const cell2 = new Cell({ x: 500, y: 500 });

        expect(cell1.pos.x).toBe(0);
        expect(cell1.pos.y).toBe(0);

        expect(cell2.pos.x).toBe(500);
        expect(cell2.pos.y).toBe(500);
    });

    it('Should have cube position set correctly', () => {
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

    it('Should calculate distance between cells', () => {
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
});

describe('Cell movement conditions tests', () => {
    it('Should have movement disabled through water', () => {
        const cell1 = new ShallowWaterCell({ x: 0, y: 0 });
        const cell2 = new DeepWaterCell({ x: 0, y: 0 });

        expect(cell1.movementEnabled).toBe(false);
        expect(cell2.movementEnabled).toBe(false);
    });

    it('Should have movement disabled through placeholder', () => {
        const cell = new PlaceholderCell({ x: 0, y: 0 });

        expect(cell.movementEnabled).toBe(false);
    });

    it('Should have movement enabled through land', () => {
        const cell1 = new PlainCell({ x: 0, y: 0 });
        const cell2 = new HighlandCell({ x: 0, y: 0 });
        const cell3 = new MountainCell({ x: 0, y: 0 });

        expect(cell1.movementEnabled).toBe(true);
        expect(cell2.movementEnabled).toBe(true);
        expect(cell3.movementEnabled).toBe(true);
    });

    it('Should be harder to move through highlands and mountains than plains', () => {
        const cell1 = new PlainCell({ x: 0, y: 0 });
        const cell2 = new HighlandCell({ x: 0, y: 0 });
        const cell3 = new MountainCell({ x: 0, y: 0 });

        expect(cell1.movementCost).toBeLessThan(cell2.movementCost);
        expect(cell1.movementCost).toBeLessThan(cell3.movementCost);
        expect(cell2.movementCost).toBeLessThan(cell3.movementCost);
    });
});

describe('Cell highlight tests', () => {
    it('Should return hover before select', () => {
        const cell = new Cell({ x: 0, y: 0 });

        cell.highlightModifier = HighlightModifiers.Select | HighlightModifiers.Hover;

        expect(cell.getHighlightColor()).toEqual(HighlightColors.Hover);
    });

    it('Should return select before path', () => {
        const cell = new Cell({ x: 0, y: 0 });

        cell.highlightModifier = HighlightModifiers.Path | HighlightModifiers.Select;

        expect(cell.getHighlightColor()).toEqual(HighlightColors.Select);
    });

    it('Should return path if exists', () => {
        const cell = new Cell({ x: 0, y: 0 });

        cell.highlightModifier = HighlightModifiers.Path;

        expect(cell.getHighlightColor()).toEqual(HighlightColors.Path);
    });

    it('Should return no higlight', () => {
        const cell = new Cell({ x: 0, y: 0 });

        expect(cell.getHighlightColor()).toEqual(HighlightColors.None);
    });
});

describe('Cell type to string tests', () => {
    it('Should return cell type as string', () => {
        const cell1 = new PlainCell({ x: 0, y: 0 });
        const cell2 = new HighlandCell({ x: 0, y: 0 });
        const cell3 = new MountainCell({ x: 0, y: 0 });
        const cell4 = new ShallowWaterCell({ x: 0, y: 0 });
        const cell5 = new DeepWaterCell({ x: 0, y: 0 });

        expect(cell1.typeString).toEqual('Plain');
        expect(cell2.typeString).toEqual('Highland');
        expect(cell3.typeString).toEqual('Mountain');
        expect(cell4.typeString).toEqual('ShallowWater');
        expect(cell5.typeString).toEqual('DeepWater');
    });
});

describe('Cell getStandardFillColor method tests', () => {
    it('Should return terrain color', () => {
        const cell1 = new PlainCell({ x: 0, y: 0 });
        const cell2 = new HighlandCell({ x: 0, y: 0 });
        const cell3 = new MountainCell({ x: 0, y: 0 });
        const cell4 = new ShallowWaterCell({ x: 0, y: 0 });
        const cell5 = new DeepWaterCell({ x: 0, y: 0 });
        const cell6 = new PlaceholderCell({ x: 0, y: 0 });

        expect(cell1.getStandardFillColor(MapMode.Terrain)).toEqual(CellTerrainColor.Plain);
        expect(cell2.getStandardFillColor(MapMode.Terrain)).toEqual(CellTerrainColor.Highland);
        expect(cell3.getStandardFillColor(MapMode.Terrain)).toEqual(CellTerrainColor.Mountain);
        expect(cell4.getStandardFillColor(MapMode.Terrain)).toEqual(CellTerrainColor.ShallowWater);
        expect(cell5.getStandardFillColor(MapMode.Terrain)).toEqual(CellTerrainColor.DeepWater);
        expect(cell6.getStandardFillColor(MapMode.Terrain)).toEqual(CellTerrainColor.Placeholder);
    });

    it('Should return nation color if nation exists', () => {
        const testColor = '#FFF';
        const nation = new Nation(1, 'test', testColor);

        const cell1 = new PlainCell({ x: 0, y: 0 });
        cell1.nation = nation;

        const cell2 = new HighlandCell({ x: 0, y: 0 });
        cell2.nation = nation;

        const cell3 = new MountainCell({ x: 0, y: 0 });
        cell3.nation = nation;
        
        expect(cell1.getStandardFillColor(MapMode.Political)).toEqual(testColor);
        expect(cell2.getStandardFillColor(MapMode.Political)).toEqual(testColor);
        expect(cell3.getStandardFillColor(MapMode.Political)).toEqual(testColor);
    });

    it('Should return const value if no nation available', () => {
        const cell1 = new PlainCell({ x: 0, y: 0 });
        const cell2 = new HighlandCell({ x: 0, y: 0 });
        const cell3 = new MountainCell({ x: 0, y: 0 });

        expect(cell1.getStandardFillColor(MapMode.Political)).toEqual(CellConstant.NoNation);
        expect(cell2.getStandardFillColor(MapMode.Political)).toEqual(CellConstant.NoNation);
        expect(cell3.getStandardFillColor(MapMode.Political)).toEqual(CellConstant.NoNation);
    });

    it('Should return terrain color even in political view with nation', () => {
        const testColor = '#FFF';
        const nation = new Nation(1, 'test', testColor);

        const cell1 = new ShallowWaterCell({ x: 0, y: 0 });
        cell1.nation = nation;

        const cell2 = new DeepWaterCell({ x: 0, y: 0 });
        cell2.nation = nation;

        const cell3 = new PlaceholderCell({ x: 0, y: 0 });
        cell3.nation = nation;

        expect(cell1.getStandardFillColor(MapMode.Political)).toEqual(CellTerrainColor.ShallowWater);
        expect(cell2.getStandardFillColor(MapMode.Political)).toEqual(CellTerrainColor.DeepWater);
        expect(cell3.getStandardFillColor(MapMode.Political)).toEqual(CellTerrainColor.Placeholder);
    });

    it('Should return terrain color even in political view without nation', () => {
        const cell1 = new ShallowWaterCell({ x: 0, y: 0 });
        const cell2 = new DeepWaterCell({ x: 0, y: 0 });
        const cell3 = new PlaceholderCell({ x: 0, y: 0 });

        expect(cell1.getStandardFillColor(MapMode.Political)).toEqual(CellTerrainColor.ShallowWater);
        expect(cell2.getStandardFillColor(MapMode.Political)).toEqual(CellTerrainColor.DeepWater);
        expect(cell3.getStandardFillColor(MapMode.Political)).toEqual(CellTerrainColor.Placeholder);
    });

    it('Should throw if incorrect map mode is provided', () => {
        const cell = new PlainCell({ x: 0, y: 0 });

        expect(cell.getStandardFillColor.bind('xxx' as unknown as MapMode)).toThrow();
    });
});

describe('Cell getFillColorForMode method tests', () => {
    it('Should call getHighlightColor method if is hihglighted', () => {
        const spy = jest.spyOn(Cell.prototype, 'getHighlightColor').mockImplementation(jest.fn());

        const cell = new PlainCell({ x: 0, y: 0 });

        cell.highlightModifier |= HighlightModifiers.Hover;
        cell.getFillColorForMode(MapMode.Terrain);

        expect(spy).toBeCalled();

        spy.mockRestore();
    });
    
    it('Should call getHighlightColor method if is hihglighted', () => {
        const spy = jest.spyOn(Cell.prototype, 'getStandardFillColor').mockImplementation(jest.fn());

        const cell = new PlainCell({ x: 0, y: 0 });

        cell.getFillColorForMode(MapMode.Terrain);

        expect(spy).toBeCalled();

        spy.mockRestore();
    });
});