import { getHoverTooltip, getSelectTooltip } from "../../cell/cellTooltip";

const hoverTooltipMock = document.createElement('div');
hoverTooltipMock.id = 'cellHoverInfo';

const selectTooltipMock = document.createElement('div');
selectTooltipMock.id = 'cellSelectInfo';

document.body.append(hoverTooltipMock);
document.body.append(selectTooltipMock);

describe('Cell tooltip tests', () => {
    it('Should return hover tooltip', () => {
        expect(getHoverTooltip()).toBe(hoverTooltipMock);
    });

    it('Should return select tooltpi', () => {
        expect(getSelectTooltip()).toBe(selectTooltipMock);
    });
});