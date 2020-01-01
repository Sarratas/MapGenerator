import { Cell } from './cell';
import { hoverImages, HighlightModifiers } from './cellDefines';
import { getHoverTooltip, getSelectTooltip } from './cellTooltip';

export default class CellHooks {
    public static onCellHoverIn(this: Cell, _event: MouseEvent): void {
        const hoverTooltip = getHoverTooltip();

        hoverTooltip.hidden = false;
        const elemsToUpdate = hoverTooltip.querySelectorAll('.tooltipHoverContent') as NodeListOf<HTMLElement>;
        for (const elem of elemsToUpdate) {
            const content = elem.dataset['content']! as keyof Cell;
            elem.innerHTML = this[content]?.toString() ?? '';
        }
        hoverTooltip.querySelector('img')!.src = hoverImages[this.type];

        this.highlightModifier |= HighlightModifiers.Hover;
    }

    public static onCellHoverOut(this: Cell, _event: MouseEvent): void {
        const hoverTooltip = getHoverTooltip();

        hoverTooltip.hidden = true;

        this.highlightModifier &= ~HighlightModifiers.Hover;
    }

    public static onCellSelect(this: Cell, _event: MouseEvent): void {
        const selectTooltip = getSelectTooltip();

        selectTooltip.hidden = false;
        const elemsToUpdate = selectTooltip.querySelectorAll('.tooltipSelectContent') as NodeListOf<HTMLElement>;
        for (const elem of elemsToUpdate) {
            const content = elem.dataset['content']! as keyof Cell;
            elem.innerHTML = this[content]?.toString() ?? '';
        }
        selectTooltip.querySelector('img')!.src = hoverImages[this.type];

        this.highlightModifier ^= HighlightModifiers.Select;

    }

    public static onCellDeselect(this: Cell, _event: MouseEvent): void {
        const selectTooltip = getSelectTooltip();

        selectTooltip.hidden = true;

        this.highlightModifier &= ~HighlightModifiers.Select;
    }
}
