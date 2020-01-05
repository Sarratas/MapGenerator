import CellHooks from '../../cell/cellHooks';
import { Cell, PlainCell } from '../../cell/cell';
import { HighlightModifiers } from '../../cell/cellDefines';

const hoverTooltipMock = document.createElement('div');
const selectTooltipMock = document.createElement('div');

jest.mock('../../cell/cellTooltip', () => ({
    getHoverTooltip: jest.fn(() => hoverTooltipMock),
    getSelectTooltip: jest.fn(() => selectTooltipMock),
}));

describe('Cell hooks tests', () => {
    it('Should show tooltip and update tooltip content on cell hover', () => {
        const cell = new Cell({ x: 0, y: 0 });

        const spy = jest.spyOn(CellHooks, 'updateTooltipContent').mockImplementation(() => { });

        CellHooks.onCellHoverIn.call(cell, new MouseEvent('hover'));

        expect(CellHooks.updateTooltipContent).toBeCalledTimes(1);

        expect(hoverTooltipMock.hidden).toBeFalsy();

        spy.mockRestore();
    });

    it('Should highlight cell when hovered', () => {
        const cell = new Cell({ x: 0, y: 0 });

        const spy = jest.spyOn(CellHooks, 'updateTooltipContent').mockImplementation(() => { });

        CellHooks.onCellHoverIn.call(cell, new MouseEvent('hover'));

        expect(cell.highlightModifier & HighlightModifiers.Hover).toBeTruthy();

        spy.mockRestore();
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

        const spy = jest.spyOn(CellHooks, 'updateTooltipContent').mockImplementation(() => {});

        CellHooks.onCellSelect.call(cell, new MouseEvent('click'));

        expect(CellHooks.updateTooltipContent).toBeCalledTimes(1);

        expect(selectTooltipMock.hidden).toBeFalsy();

        spy.mockRestore();
    });

    it('Should highlight cell when hovered', () => {
        const cell = new Cell({ x: 0, y: 0 });

        const spy = jest.spyOn(CellHooks, 'updateTooltipContent').mockImplementation(() => { });

        CellHooks.onCellSelect.call(cell, new MouseEvent('hover'));

        expect(cell.highlightModifier & HighlightModifiers.Select).toBeTruthy();

        spy.mockRestore();
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

describe('Cell hooks dom update test', () => {
    it('Should update values based on found elements', () => {
        document.body.innerHTML = `
            <div>
            <div id="cellHoverInfo">
                <img />
                <div class="tooltipHoverContent" data-content="typeString"></div>
                <div class="tooltipHoverContent" data-content="nonexistingContent"></div>
            </div>
        `;

        const cell = new PlainCell({ x: 0, y: 0 });
        const tooltip = document.getElementById('cellHoverInfo')!;
        const selector = '.tooltipHoverContent';

        CellHooks.updateTooltipContent.call(cell, tooltip, selector);
        
        expect(document.body.innerHTML).toMatch('Plain');
    });
});