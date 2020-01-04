import CellHooks from '../cell/cellHooks';
import { Cell } from '../cell/cell';
import { HighlightModifiers } from '../cell/cellDefines';

const hoverTooltipMock = document.createElement('div');
const selectTooltipMock = document.createElement('div');

jest.mock('../cell/cellTooltip', () => ({
    getHoverTooltip: jest.fn(() => hoverTooltipMock),
    getSelectTooltip: jest.fn(() => selectTooltipMock),
}));

describe('Cell hooks tests', () => {
    it('Should show tooltip and update tooltip content on cell hover', () => {
        const cell = new Cell({ x: 0, y: 0 });

        CellHooks.updateTooltipContent = jest.fn();

        CellHooks.onCellHoverIn.call(cell, new MouseEvent('hover'));

        expect(CellHooks.updateTooltipContent).toBeCalledTimes(1);

        expect(hoverTooltipMock.hidden).toBeFalsy();
    });

    it('Should highlight cell when hovered', () => {
        const cell = new Cell({ x: 0, y: 0 });

        CellHooks.updateTooltipContent = jest.fn();

        CellHooks.onCellHoverIn.call(cell, new MouseEvent('hover'));

        expect(cell.highlightModifier & HighlightModifiers.Hover).toBeTruthy();
    });

    it('Should hide tooltip on hover out', () => {
        const cell = new Cell({ x: 0, y: 0 });

        hoverTooltipMock.hidden = false;

        CellHooks.onCellHoverOut.call(cell, new MouseEvent('hover'));

        expect(hoverTooltipMock.hidden).toBeTruthy();
    });

    it('Should cancel highlight on hover out', () => {
        const cell = new Cell({ x: 0, y: 0 });

        cell.highlightModifier &= HighlightModifiers.Hover;

        CellHooks.onCellHoverOut.call(cell, new MouseEvent('hover'));

        expect(cell.highlightModifier & HighlightModifiers.Hover).toBeFalsy();
    });

    it('Should show tooltip and update tooltip content on cell select', () => {
        const cell = new Cell({ x: 0, y: 0 });

        CellHooks.updateTooltipContent = jest.fn();

        CellHooks.onCellSelect.call(cell, new MouseEvent('click'));

        expect(CellHooks.updateTooltipContent).toBeCalledTimes(1);

        expect(selectTooltipMock.hidden).toBeFalsy();
    });

    it('Should highlight cell when hovered', () => {
        const cell = new Cell({ x: 0, y: 0 });

        CellHooks.updateTooltipContent = jest.fn();

        CellHooks.onCellSelect.call(cell, new MouseEvent('hover'));

        expect(cell.highlightModifier & HighlightModifiers.Select).toBeTruthy();
    });

    it('Should hide tooltip on deselect', () => {
        const cell = new Cell({ x: 0, y: 0 });

        selectTooltipMock.hidden = false;

        CellHooks.onCellDeselect.call(cell, new MouseEvent('hover'));

        expect(selectTooltipMock.hidden).toBeTruthy();
    });

    it('Should cancel highlight on deselect', () => {
        const cell = new Cell({ x: 0, y: 0 });

        cell.highlightModifier &= HighlightModifiers.Select;

        CellHooks.onCellDeselect.call(cell, new MouseEvent('hover'));

        expect(cell.highlightModifier & HighlightModifiers.Select).toBeFalsy();
    });
});
