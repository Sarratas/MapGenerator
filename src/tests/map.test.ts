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

describe('Zoom in tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Zoom in to top left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn({ x: 0, y: 0 });

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 0, y: 0 });

        map.zoomIn({ x: 0, y: 0 });

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 0, y: 0 });
    });

    test('Zoom in to bottom left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn({ x: 0, y: 100 });

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 0, y: 50 });

        map.zoomIn({ x: 0, y: 100 });

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 0, y: 75 });
    });

    test('Zoom in to top right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn({ x: 100, y: 0 });

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 50, y: 0 });

        map.zoomIn({ x: 100, y: 0 });

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 75, y: 0 });
    });

    test('Zoom in to bottom right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn({ x: 100, y: 100 });

        expect(map['scale']).toBe(2);
        expect(map.getPosition()).toEqual({ x: 50, y: 50 });

        map.zoomIn({ x: 100, y: 100 });

        expect(map['scale']).toBe(4);
        expect(map.getPosition()).toEqual({ x: 75, y: 75 });
    });

    test('Zoom in to random direction', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scale']).toBe(1);

        map.zoomIn({ x: 15, y: 0 });
        map.zoomIn({ x: 0, y: 15 });
        map.zoomIn({ x: 20, y: 20 });

        expect(map['scale']).toBe(8);
        expect(map.getPosition()).toEqual({ x: 10, y: 6.25 });
    });

    test('Zoom in limit', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        expect(map['scaleIndex']).toBe(0);

        const maxScaleIndex = map['maxScaleIndex'];

        for (let i = 0; i < maxScaleIndex + 1; ++i) {
            map.zoomIn({ x: 0, y: 0 });
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

        const minScaleIndex = map['minScaleIndex'];

        expect(map['scaleIndex']).toBe(minScaleIndex);

        map.zoomOut({ x: 0, y: 0 });

        expect(map['scaleIndex']).toBe(minScaleIndex);
    });

    test('Zoom out to top left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn({ x: 50, y: 50 });
        map.zoomIn({ x: 50, y: 50 });

        map.zoomOut({ x: 0, y: 0 });

        const pos = map.getPosition();

        expect(pos.x).toBeCloseTo(37.5);
        expect(pos.y).toBeCloseTo(37.5);
    });

    test('Zoom out to top right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn({ x: 50, y: 50 });
        map.zoomIn({ x: 50, y: 50 });

        map.zoomOut({ x: 100, y: 0 });

        const pos = map.getPosition();

        expect(pos.x).toBeCloseTo(12.5);
        expect(pos.y).toBeCloseTo(37.5);
    });

    test('Zoom out to bottom left corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn({ x: 50, y: 50 });
        map.zoomIn({ x: 50, y: 50 });

        map.zoomOut({ x: 0, y: 100 });

        const pos = map.getPosition();

        expect(pos.x).toBeCloseTo(37.5);
        expect(pos.y).toBeCloseTo(12.5);
    });

    test('Zoom out to bottom right corner', () => {
        const map = new WorldMap(100, 100);
        const canvas = createTestCanvas(100, 100);

        map.initView(canvas, 0);

        map.zoomIn({ x: 50, y: 50 });
        map.zoomIn({ x: 50, y: 50 });

        map.zoomOut({ x: 100, y: 100 });

        const pos = map.getPosition();

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

        const initCell = map['cellsSquare'][5][5];
        map['cellsSquare'][5][6].type = CellTypes.Plain;

        const adjacentCellsAll = map['getAdjacentCellsSquare'](initCell, 1);
        const adjacentCellsPlain = map['getAdjacentCellsSquare'](initCell, 1, CellTypes.Plain);

        expect(adjacentCellsAll.length).toBe(8);
        expect(adjacentCellsPlain.length).toBe(1);

        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 4, y: 4 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 4, y: 5 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 4, y: 6 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 5, y: 4 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 5, y: 6 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 6, y: 4 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 6, y: 5 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 6, y: 6 }})]));
        expect(adjacentCellsAll).not.toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 5, y: 5 }})]));

        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ pos: { x: 5, y: 6 }})]));
    });

    test('Adjacent cells for cube coords', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        const initCell = map['getCellCube']({ x: 10, y: -20, z: 10 })!;
        map['getCellCube']({ x: 10, y: -21, z: 11 })!.type = CellTypes.Plain;

        const adjacentCellsAll = map['getAdjacentCellsCube'](initCell, 1);
        const adjacentCellsPlain = map['getAdjacentCellsCube'](initCell, 1, CellTypes.Plain);

        expect(adjacentCellsAll.length).toBe(6);
        expect(adjacentCellsPlain.length).toBe(1);

        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 10, y: -21, z: 11 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 10, y: -19, z: 9 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 11, y: -20, z: 9 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 11, y: -21, z: 10 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 9, y: -20, z: 11 }})]));
        expect(adjacentCellsAll).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 9, y: -19, z: 10 }})]));
        expect(adjacentCellsAll).not.toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 10, y: -20, z: 10 }})]));

        expect(adjacentCellsPlain).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 10, y: -21, z: 11 }})]));
    });
});

describe('Path calculation tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Calculate straight path', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        const path = map.calculatePath(0, 0, 5, 5)!;

        expect(path.getCost()).toBe(9);

        const pathCells = path['cells'];

        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: 0, z: 0 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: -1, z: 1 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 1, y: -2, z: 1 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 2, y: -3, z: 1 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 2, y: -4, z: 2 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 2, y: -5, z: 3 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 2, y: -6, z: 4 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 3, y: -7, z: 4 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 3, y: -8, z: 5 }})]));
    });

    test('Result undefined if path start not found', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['cellsSquare'][0][0].movementEnabled = false;

        const path = map.calculatePath(0, 0, 5, 5);

        expect(path).toBeUndefined();
    });

    test('Result undefined if path end not found', () => {
        const map = new WorldMap(50, 50);
        const canvas = createTestCanvas(50, 50);

        map.initView(canvas, 0);

        map['cellsSquare'][5][5].movementEnabled = false;

        const path = map.calculatePath(0, 0, 5, 5);

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
