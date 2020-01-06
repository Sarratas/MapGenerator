import './canvasContext.mock';
import { WorldMap, MapMode } from '../../map/worldMap';
import { CellTypes } from '../../cell/cellDefines';
import { Cell } from '../../cell/cell';

function prepareDomBeforeTest() {
    document.body.innerHTML = `
        <div>
          <div id="cellHoverInfo" />
          <div id="cellSelectInfo" />
        </div>
    `;
}

function createTestCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

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
        new Cell({ x: 4, y: 1 }, CellTypes.ShallowWater),
        new Cell({ x: 4, y: 2 }, CellTypes.Plain),
        new Cell({ x: 4, y: 3 }, CellTypes.ShallowWater),
        new Cell({ x: 4, y: 4 }, CellTypes.Plain),
    ],
];

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

describe('Path calculation tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Calculate path through mountains', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const path = map.calculatePath(0, 0, 2, 2)!;

        expect(path.getCost()).toBe(4);
        expect(path.getRealCost()).toBe(8);

        const pathCells = path['cells'];

        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: 0, z: 0 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 0, y: -1, z: 1 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 1, y: -2, z: 1 }})]));
        expect(pathCells).toEqual(expect.arrayContaining([expect.objectContaining({ posCube: { x: 1, y: -3, z: 2 }})]));
    });

    test('Calculate optimal path around mountains', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const path = map.calculatePath(0, 0, 4, 4)!;

        expect(path.getCost()).toBe(8);
        expect(path.getRealCost()).toBe(8);
    });

    test('Result undefined if path ends in the water', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const path = map.calculatePath(0, 0, 3, 3);

        expect(path).toBeUndefined();
    });

    test('Result undefined if path starts in the water', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const path = map.calculatePath(3, 3, 0, 0);

        expect(path).toBeUndefined();
    });

    test('Result undefined if there is no path between points', () => {
        const map = new WorldMap(5, 5, mockedCells);

        const path = map.calculatePath(0, 0, 4, 2);

        expect(path).toBeUndefined();
    });
});

describe('Rendering tests', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Render square call', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        map['renderSquare'] = jest.fn();

        map.render();

        expect(map['renderSquare']).toBeCalled();
    });

    test('Render square implementation', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        expect(map.render.bind(map, canvas)).not.toThrow();
    });

    test('Render hexagonal call', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        map['scale'] = map['hexagonThresholdScale'];
        map['renderHexagonal'] = jest.fn();

        map.render();

        expect(map['renderHexagonal']).toBeCalled();
    });


    test('Render hexagonal implementation', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        map['scale'] = map['hexagonThresholdScale'];

        expect(map.render).not.toThrow();
    });


    test('Render textures implementation', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        map['scale'] = map['textureThresholdScale'];

        map.render();

        expect(map.render).not.toThrow();
    });

    test('Unbind the view', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        expect(() => map.unbindView()).not.toThrow();
    });

    test('Unbind the view without canvas', () => {
        const map = new WorldMap(5, 5, mockedCells);

        expect(() => map.unbindView()).not.toThrow();
    });
});

describe('Finding cell from position', () => {
    beforeEach(() => prepareDomBeforeTest());

    test('Finding cell in hexagonal', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        map['scale'] = map['hexagonThresholdScale'];

        expect(map['findCellFromPos']({ x: 1, y: 1 })).toBe(map['cellsSquare'][0][0]);
        expect(map['findCellFromPos']({ x: 10, y: 10 })).toBe(map['cellsSquare'][0][1]);
        expect(map['findCellFromPos']({ x: 35, y: 30 })).toBe(map['cellsSquare'][3][3]);
        expect(map['findCellFromPos']({ x: 35, y: 40 })).toBe(map['cellsSquare'][3][4]);
        expect(map['findCellFromPos']({ x: 60, y: 60 })).toBeUndefined();
    });
});

describe('Calculating position in canvas', () => {
    beforeAll(() => {
        const testStyle = new CSSStyleDeclaration();
        testStyle.setProperty('border-top-width', '2px');
        testStyle.setProperty('border-left-width', '2px');
        jest.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() => {
            return {
                width: 9,
                height: 9,
                top: 1,
                left: 1,
                bottom: 0,
                right: 0,
                x: 1,
                y: 1,
                toJSON: () => '',
            }
        });
        jest.spyOn(window, 'getComputedStyle').mockImplementation((_elem: Element) => testStyle);
    });

    beforeEach(() => prepareDomBeforeTest());

    test('Calculating position in canvas 1', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        const event = new MouseEvent('', { clientX: 1, clientY: 1 });
        expect(map['getMousePos'](event)).toEqual({ x: 0, y: 0 });
    });

    test('Calculating position in canvas 2', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        const event = new MouseEvent('', { clientX: 3, clientY: 3 });
        expect(map['getMousePos'](event)).toEqual({ x: 0, y: 0 });
    });

    test('Calculating position in canvas 3', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        const event = new MouseEvent('', { clientX: 5, clientY: 5 });
        expect(map['getMousePos'](event)).toEqual({ x: 2, y: 2 });
    });

    test('Calculating position in canvas 4', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        const event = new MouseEvent('', { clientX: 7, clientY: 7 });
        expect(map['getMousePos'](event)).toEqual({ x: 4, y: 4 });
    });

    test('Calculating position in canvas 5', () => {
        const map = new WorldMap(5, 5, mockedCells);
        const canvas = createTestCanvas(5, 5);

        map.initView(canvas, 0);

        const event = new MouseEvent('', { clientX: 9, clientY: 9 });
        expect(map['getMousePos'](event)).toEqual({ x: 4, y: 4 });
    });
});

describe('Set map mode test', () => {
    test('Setting default map mode', () => {
        const map = new WorldMap(5, 5, mockedCells);

        expect(map['mode']).toEqual(MapMode.Terrain);
    });

    test('Setting new map mode', () => {
        const map = new WorldMap(5, 5, mockedCells);

        map.setMapMode(MapMode.Political);

        expect(map['mode']).toEqual(MapMode.Political);
    });
});
