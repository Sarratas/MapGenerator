import { Cell } from './cell';
import { hoverImages, HighlightModifiers } from './cellDefines';
import { getHoverTooltip, getSelectTooltip } from './cellTooltip';

export default class CellHooks {
    public static onCellHoverIn(this: Cell, _event: MouseEvent): void {
        const hoverTooltip = getHoverTooltip();

        hoverTooltip.hidden = false;
        CellHooks.updateTooltipContent.call(this, hoverTooltip, '.tooltipHoverContent');

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
        CellHooks.updateTooltipContent.call(this, selectTooltip, '.tooltipSelectContent');

        this.highlightModifier ^= HighlightModifiers.Select;
    }

    public static onCellDeselect(this: Cell, _event: MouseEvent): void {
        const selectTooltip = getSelectTooltip();

        selectTooltip.hidden = true;

        this.highlightModifier &= ~HighlightModifiers.Select;
    }

    public static updateTooltipContent(this: Cell, tooltip: HTMLElement, selector: string): void {
        const elemsToUpdate = tooltip.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        for (const elem of elemsToUpdate) {
            const content = elem.dataset['content']! as keyof Cell;
            elem.innerHTML = this[content]?.toString() ?? '';
        }
        tooltip.querySelector('img')!.src = hoverImages[this.type];
    }
}
