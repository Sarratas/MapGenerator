import { WorldMap } from "../../map/worldMap";
import MouseHandlers from "../../map/mouseHandlers";
import { Cell } from "../../cell/cell";

describe('Handle mouse wheel tests', () => {
    it('Should call zoom in function', () => {
        const map = new WorldMap(5, 5, []);

        map['zoomIn'] = jest.fn();

        MouseHandlers.handleMouseWheel.call(map, new WheelEvent('wheel', { deltaY: -1 }));

        expect(map['zoomIn']).toBeCalledTimes(1);
    });

    it('Should call zoom out function', () => {
        const map = new WorldMap(5, 5, []);

        map['zoomOut'] = jest.fn();

        MouseHandlers.handleMouseWheel.call(map, new WheelEvent('wheel', { deltaY: 1 }));

        expect(map['zoomOut']).toBeCalledTimes(1);
    });

    it('Should not call zooming functions', () => {
        const map = new WorldMap(5, 5, []);

        map['zoomOut'] = jest.fn();
        map['zoomIn'] = jest.fn();

        MouseHandlers.handleMouseWheel.call(map, new WheelEvent('wheel', { deltaY: 0 }));

        expect(map['zoomOut']).not.toBeCalled();
        expect(map['zoomIn']).not.toBeCalled();
    });
});

describe('Handle mouse down tests', () => {
    it('Should set mouse state down', () => {
        const map = new WorldMap(5, 5, []);

        map['getMousePos'] = jest.fn();

        expect(map['isMouseDown']).toBeFalsy();

        MouseHandlers.handleMouseDown.call(map, new MouseEvent('mousedown'));

        expect(map['isMouseDown']).toBeTruthy();
    });
});

describe('Handle mouse move tests', () => {
    it('Should handle dragging if mouse is down', () => {
        const map = new WorldMap(5, 5, []);

        map['getMousePos'] = jest.fn();
        map['handleMouseDrag'] = jest.fn();
        map['isMouseInside'] = true;
        map['isMouseDown'] = true;
        
        expect(map['isDragging']).toBeFalsy();

        MouseHandlers.handleMouseMove.call(map, new MouseEvent('mousemove'));

        expect(map['isDragging']).toBeTruthy();
        expect(map['handleMouseDrag']).toBeCalled();
    });

    it('Should call cell hover in if position on cell', () => {
        const map = new WorldMap(5, 5, []);
        const cell = new Cell({ x: 1, y: 1 });

        map['getMousePos'] = jest.fn();
        map['findCellFromPos'] = jest.fn(() => cell);
        map['onCellHoverIn'] = jest.fn();
        map['isMouseInside'] = true;
        map['hoveredCell'] = undefined;

        MouseHandlers.handleMouseMove.call(map, new MouseEvent('mousemove'));

        expect(map['hoveredCell']).toBe(cell);
        expect(map['onCellHoverIn']).toBeCalled();
    });

    it('Should call cell hover out if left the cell area', () => {
        const map = new WorldMap(5, 5, []);
        const cell = new Cell({ x: 1, y: 1 });

        map['getMousePos'] = jest.fn();
        map['findCellFromPos'] = jest.fn(() => undefined);
        map['onCellHoverOut'] = jest.fn();
        map['isMouseInside'] = true;
        map['hoveredCell'] = cell;

        MouseHandlers.handleMouseMove.call(map, new MouseEvent('mousemove'));

        expect(map['hoveredCell']).toBeUndefined();
        expect(map['onCellHoverOut']).toBeCalled();
    });

    it('Should not call handlers if hovered cell did not change', () => {
        const map = new WorldMap(5, 5, []);
        const cell = new Cell({ x: 1, y: 1 });

        map['getMousePos'] = jest.fn();
        map['findCellFromPos'] = jest.fn(() => cell);
        map['onCellHoverOut'] = jest.fn();
        map['onCellHoverIn'] = jest.fn();
        map['isMouseInside'] = true;
        map['hoveredCell'] = cell;

        MouseHandlers.handleMouseMove.call(map, new MouseEvent('mousemove'));

        expect(map['hoveredCell']).toBe(cell);
        expect(map['onCellHoverOut']).not.toBeCalled();
        expect(map['onCellHoverIn']).not.toBeCalled();
    });
});

describe('Handle mouse up tests', () => {
    it('Should handle dragging if was dragging', () => {
        const map = new WorldMap(5, 5, []);

        map['getMousePos'] = jest.fn();
        map['handleMouseDrag'] = jest.fn();
        map['isDragging'] = true;

        MouseHandlers.handleMouseUp.call(map, new MouseEvent('mouseup'));

        expect(map['isDragging']).toBeFalsy();
        expect(map['handleMouseDrag']).toBeCalled();
    });

    it('Should select cell if was not previously selected', () => {
        const map = new WorldMap(5, 5, []);
        const cell = new Cell({ x: 0, y: 0 });

        map['getMousePos'] = jest.fn();
        map['findCellFromPos'] = jest.fn(() => cell);
        map['onCellSelect'] = jest.fn();
        map['selectedCell'] = undefined;

        MouseHandlers.handleMouseUp.call(map, new MouseEvent('mouseup'));

        expect(map['onCellSelect']).toBeCalled();
        expect(map['selectedCell']).toBe(cell);
    });

    it('Should deselect cell if was previously selected', () => {
        const map = new WorldMap(5, 5, []);
        const cell = new Cell({ x: 0, y: 0 });

        map['getMousePos'] = jest.fn();
        map['findCellFromPos'] = jest.fn(() => cell);
        map['onCellDeselect'] = jest.fn();
        map['selectedCell'] = cell;

        MouseHandlers.handleMouseUp.call(map, new MouseEvent('mouseup'));

        expect(map['onCellDeselect']).toBeCalled();
        expect(map['selectedCell']).toBeUndefined();
    });

    it('Should select new cell and deselect old', () => {
        const map = new WorldMap(5, 5, []);
        const cell1 = new Cell({ x: 0, y: 0 });
        const cell2 = new Cell({ x: 1, y: 1 });

        map['getMousePos'] = jest.fn();
        map['findCellFromPos'] = jest.fn(() => cell2);
        map['onCellDeselect'] = jest.fn();
        map['onCellSelect'] = jest.fn();
        map['selectedCell'] = cell1;

        MouseHandlers.handleMouseUp.call(map, new MouseEvent('mouseup'));

        expect(map['onCellDeselect']).toBeCalled();
        expect(map['onCellSelect']).toBeCalled();
        expect(map['selectedCell']).toBe(cell2);
    });
});

describe('Mouse enter and leave tests', () => {
    it('Should stop dragging and set mouse as inside', () => {
        const map = new WorldMap(5, 5, []);

        map['isMouseInside'] = false;
        map['isDragging'] = true;

        MouseHandlers.handleMouseEnter.call(map, new MouseEvent('mouseleave'));

        expect(map['isMouseInside']).toBeTruthy();
        expect(map['isDragging']).toBeFalsy();
    });

    it('Should stop dragging and set mouse as outside', () => {
        const map = new WorldMap(5, 5, []);

        map['isMouseInside'] = true;
        map['isDragging'] = true;

        MouseHandlers.handleMouseLeave.call(map, new MouseEvent('mouseleave'));

        expect(map['isMouseInside']).toBeFalsy();
        expect(map['isDragging']).toBeFalsy();
    });

    it('Should cancel hover and call handler', () => {
        const map = new WorldMap(5, 5, []);
        const cell = new Cell({ x: 0, y: 0 });

        map['hoveredCell'] = cell;
        map['onCellHoverOut'] = jest.fn();

        MouseHandlers.handleMouseLeave.call(map, new MouseEvent('mouseleave'));

        expect(map['hoveredCell']).toBeUndefined();
        expect(map['onCellHoverOut']).toBeCalled();
    });
});

describe('Handle mouse drag tests', () => {
    it('Should not throw', () => {
        const map = new WorldMap(5, 5, []);

        map['movePosition'] = jest.fn(() => true);

        expect(map['handleMouseDrag'].bind(map, { x: 1, y: 1 })).not.toThrow();
    });
});
