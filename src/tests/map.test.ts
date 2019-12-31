import './canvasContext.mock';
import { WorldMap, NeighborAlgorithms } from '../map/worldMap';
import { ShallowWaterCell, Cell } from '../cell/cell';
import { CellTypes } from '../cell/cellDefines';

function prepareDomBeforeTest() {
    document.body.innerHTML =
        '<div>' +
        '  <div id="cellHoverInfo" />' +
        '  <div id="cellSelectInfo" />' +
        '</div>';
}

function createTestCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

describe('Map generation tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Creating map with given size', () => {
        const map = new WorldMap(100, 100);

        expect(map['width']).toBe(100);
        expect(map['height']).toBe(100);
        expect(map['size']).toBe(100 * 100);
    });

    test('Generate map functions', () => {
        const map = new WorldMap(50, 50);

        map['generateLakes'] = jest.fn();
        map['generateMountains'] = jest.fn();
        map['smoothingPass'] = jest.fn();
        map['smoothingPass2'] = jest.fn();
        map['smoothingPass3'] = jest.fn();
        map['generatePlains'] = jest.fn();
        map['convertCells'] = jest.fn();

        map.generate();

        expect(map['generateLakes']).toBeCalledTimes(1);
        expect(map['generateMountains']).toBeCalledTimes(1);
        expect(map['smoothingPass']).toBeCalledTimes(1);
        expect(map['smoothingPass2']).toBeCalledTimes(1);
        expect(map['smoothingPass3']).toBeCalledTimes(1);
        expect(map['generatePlains']).toBeCalledTimes(1);
        expect(map['convertCells']).toBeCalledTimes(1);
    });

    test('Generate empty cells', () => {
        const map = new WorldMap(50, 50);

        let cellsCount = map['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        let emptyCellsCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.None).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(emptyCellsCount).toBe(50 * 50);
    });

    test('Generate lakes', () => {
        const map = new WorldMap(50, 50);

        map['generateLakes']();

        let cellsCount = map['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        let waterCellsCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.ShallowWater).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(waterCellsCount).toBeGreaterThanOrEqual(map['generationParams']['lakeFactor'] * map.size);
    });

    test('Generate highlands', () => {
        const map = new WorldMap(50, 50);

        map['generateMountains']();

        let cellsCount = map['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        let mountainCellsCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.Mountain).length, 0);
        let highlandCellCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.Highland).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(mountainCellsCount).toBeGreaterThanOrEqual(map['generationParams']['mountainFactor'] * map.size);
        expect(highlandCellCount).toBeGreaterThanOrEqual(mountainCellsCount);
    });

    test('Generate plains', () => {
        const map = new WorldMap(50, 50);

        map['generatePlains']();

        let cellsCount = map['cellsSquare'].reduce((acc, elems) => acc += elems.length, 0);
        let plainCellsCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.Plain).length, 0);

        expect(cellsCount).toBe(50 * 50);
        expect(plainCellsCount).toBe(50 * 50);
    });

    test('Smoothing pass', () => {
        const map = new WorldMap(50, 50);

        map['cellsSquare'][1][1] = new ShallowWaterCell(1, 1);

        map['smoothingPass']();

        let waterCellsCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.ShallowWater).length, 0);
        
        expect(waterCellsCount).toBe(0);
    });

    test('Generating full map', () => {
        const map = new WorldMap(50, 50);

        expect(map.generate.bind(map)).not.toThrow();

        let plainCellsCount = map['cellsSquare'].reduce((acc, elems) => 
            acc += elems.filter(cell => cell.type === CellTypes.Placeholder || cell.type === CellTypes.None).length, 0);

        expect(plainCellsCount).toBe(0);
    });

    test('Converting cells', () => {
        const map = new WorldMap(50, 50);

        map['generatePlains']();

        let fun = jest.spyOn(Cell.prototype, 'convert').mockImplementation(() => new Cell(0, 0));

        map['convertCells']();

        expect(fun).toBeCalledTimes(50 * 50);

        jest.restoreAllMocks();
    });

    test('Setting different generation algorith', () => {
        const map = new WorldMap(50, 50, {
            generationNeighborAlgorithm: NeighborAlgorithms.Cube,
            smoothingNeighborAlgorithm: NeighborAlgorithms.Cube
        });
    
        let initCell = map['cellsSquare'][5][5];
    
        let adjacentCells1 = map['getAdjCellsForGenerating'](initCell, 1);
        let adjacentCells2 = map['getAdjCellsForSmoothing'](initCell, 1);
    
        expect(adjacentCells1.length).toBe(6);
        expect(adjacentCells2.length).toBe(6);
    });

    test('Generate full scale', () => {
        const map = new WorldMap(1000, 1000);
    
        expect(map.generate.bind(map)).not.toThrow();
    });
});

describe('Zoom in tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Zoom in to top left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn(0, 0);

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 0, y: 0 });

        map.zoomIn(0, 0);

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 0, y: 0 });
    });

    test('Zoom in to bottom left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn(0, 100);

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 0, y: 50 });

        map.zoomIn(0, 100);

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 0, y: 75 });
    });

    test('Zoom in to top right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn(100, 0);

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 50, y: 0 });

        map.zoomIn(100, 0);

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 75, y: 0 });
    });

    test('Zoom in to bottom right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn(100, 100);

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 50, y: 50 });

        map.zoomIn(100, 100);

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 75, y: 75 });
    });

    test('Zoom in to random direction', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn(15, 0);
        map.zoomIn(0, 15);
        map.zoomIn(20, 20);

        expect(map['scale']).toBe(8);
        expect(map.getPosition()).toEqual({ x: 10, y: 6.25 });
    });

    test('Zoom in limit', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scaleIndex']).toBe(0);

        let maxScaleIndex = map['maxScaleIndex'];

        for (let i = 0; i < maxScaleIndex + 1; ++i) {
            map.zoomIn(0, 0);
        }

        expect(map['scaleIndex']).toBe(maxScaleIndex);
    });
});

describe('Zoom out tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Zoom out limit', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        let minScaleIndex = map['minScaleIndex'];

        expect(map['scaleIndex']).toBe(minScaleIndex);

        map.zoomOut(0, 0);

        expect(map['scaleIndex']).toBe(minScaleIndex);
    });

    test('Zoom out to top left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn(50, 50);
        map.zoomIn(50, 50);

        map.zoomOut(0, 0);

        let pos = map.getPosition();

        expect(pos.x).toBeCloseTo(37.5);
        expect(pos.y).toBeCloseTo(37.5);
    });

    test('Zoom out to top right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn(50, 50);
        map.zoomIn(50, 50);

        map.zoomOut(100, 0);

        let pos = map.getPosition();

        expect(pos.x).toBeCloseTo(12.5);
        expect(pos.y).toBeCloseTo(37.5);
    });

    test('Zoom out to bottom left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn(50, 50);
        map.zoomIn(50, 50);

        map.zoomOut(0, 100);

        let pos = map.getPosition();

        expect(pos.x).toBeCloseTo(37.5);
        expect(pos.y).toBeCloseTo(12.5);
    });

    test('Zoom out to bottom right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn(50, 50);
        map.zoomIn(50, 50);

        map.zoomOut(100, 100);

        let pos = map.getPosition();

        expect(pos.x).toBeCloseTo(12.5);
        expect(pos.y).toBeCloseTo(12.5);
    });
});

describe('Map position operations tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Move position', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 1);

        map.movePosition(10, 10);
        expect(map.getPosition()).toEqual({ x: 5, y: 5 });

        map.movePosition(10, 10);
        expect(map.getPosition()).toEqual({ x: 10, y: 10 });

        map.movePosition(-10, -10);
        expect(map.getPosition()).toEqual({ x: 5, y: 5 });

        map.movePosition(200, 200);
        expect(map.getPosition()).toEqual({ x: 50, y: 50 });

        map.movePosition(-200, -200);
        expect(map.getPosition()).toEqual({ x: 0, y: 0 });
    });

    test('Move within canvas boundaries', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 1);

        map.movePosition(10, 10);
        expect(map.getPosition()).toEqual({ x: 5, y: 5 });

        map.movePosition(10, 10);
        expect(map.getPosition()).toEqual({ x: 10, y: 10 });

        map.movePosition(-10, -10);
        expect(map.getPosition()).toEqual({ x: 5, y: 5 });

        map.movePosition(200, 200);
        expect(map.getPosition()).toEqual({ x: 50, y: 50 });

        map.movePosition(-200, -200);
        expect(map.getPosition()).toEqual({ x: 0, y: 0 });
    });

    test('Close movement', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map['scale'] = 2;

        map.movePosition(0.2, 0.2);
        expect(map.getPosition().x).toBeCloseTo(0.1, 0.1);

        map.movePosition(0.2, 0.2);
        expect(map.getPosition().x).toBeCloseTo(0.2, 0.2);

        map.movePosition(-0.2, 0);
        expect(map.getPosition().x).toBeCloseTo(0.1, 0.2);

        map.movePosition(0, -0.2);
        expect(map.getPosition().x).toBeCloseTo(0.1, 0.1);

        map.movePosition(-0.2, -0.2);
        expect(map.getPosition().x).toBeCloseTo(0, 0);
    });
});

describe('Adjacent cells algorithm tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Adjacent cells for square coords', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        let initCell = map['cellsSquare'][5][5];
        map['cellsSquare'][5][6].type = CellTypes.Plain;

        let adjacentCellsAll = map['getAdjacentCellsSquare'](initCell, 1);
        let adjacentCellsPlain = map['getAdjacentCellsSquare'](initCell, 1, CellTypes.Plain);

        expect(adjacentCellsAll.length).toBe(8);
        expect(adjacentCellsPlain.length).toBe(1);

        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 4, posY: 4 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 4, posY: 5 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 4, posY: 6 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 5, posY: 4 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 5, posY: 6 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 6, posY: 4 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 6, posY: 5 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 6, posY: 6 })]));
        expect(adjacentCellsAll).not.toEqual(expect.arrayContaining([expect.objectContaining({ posX: 5, posY: 5 })]));

        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ posX: 5, posY: 6 })]));
    });

    test('Adjacent cells for cube coords', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        let initCell = map['getCellCube'](10, -20, 10)!;
        map['getCellCube'](10, -21, 11)!.type = CellTypes.Plain;

        let adjacentCellsAll = map['getAdjacentCellsCube'](initCell, 1);
        let adjacentCellsPlain = map['getAdjacentCellsCube'](initCell, 1, CellTypes.Plain);

        expect(adjacentCellsAll.length).toBe(6);
        expect(adjacentCellsPlain.length).toBe(1);

        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 10, cubeY: -21, cubeZ: 11 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 10, cubeY: -19, cubeZ: 9 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 11, cubeY: -20, cubeZ: 9 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 11, cubeY: -21, cubeZ: 10 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 9, cubeY: -20, cubeZ: 11 })]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 9, cubeY: -19, cubeZ: 10 })]));
        expect(adjacentCellsAll).not.toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 10, cubeY: -20, cubeZ: 10 })]));

        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 10, cubeY: -21, cubeZ: 11 })]));
    });
});

describe('Path calculation tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Calculate straight path', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        let path = map.calculatePath(0, 0, 5, 5)!;

        expect(path.getCost()).toBe(9);

        let pathCells = path['cells'];

        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 0, cubeY: 0, cubeZ: 0 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 0, cubeY: -1, cubeZ: 1 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 1, cubeY: -2, cubeZ: 1 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 2, cubeY: -3, cubeZ: 1 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 2, cubeY: -4, cubeZ: 2 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 2, cubeY: -5, cubeZ: 3 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 2, cubeY: -6, cubeZ: 4 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 3, cubeY: -7, cubeZ: 4 })]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ cubeX: 3, cubeY: -8, cubeZ: 5 })]));
    });

    test('Result undefined if path start not found', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['cellsSquare'][0][0].movementEnabled = false;

        let path = map.calculatePath(0, 0, 5, 5);

        expect(path).toBeUndefined();
    });

    test('Result undefined if path end not found', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['cellsSquare'][5][5].movementEnabled = false;

        let path = map.calculatePath(0, 0, 5, 5);

        expect(path).toBeUndefined();
    });
});

describe('Rendering tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Render square call', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['renderSquare'] = jest.fn();

        map.render();

        expect(map['renderSquare']).toBeCalled();
    });

    test('Render square implementation', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        expect(map.render.bind(map, canvas)).not.toThrow();
    });

    test('Render hexagonal call', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['scale'] = map['hexagonThresholdScale'];
        map['renderHexagonal'] = jest.fn();

        map.render();

        expect(map['renderHexagonal']).toBeCalled();
    });


    test('Render hexagonal implementation', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['scale'] = map['hexagonThresholdScale'];

        expect(map.render).not.toThrow();
    });


    test('Render textures implementation', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['scale'] = map['textureThresholdScale'];

        map.render();

        expect(map.render).not.toThrow();
    });
});
