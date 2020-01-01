import { WorldMap } from './worldMap';
import { IPosition2d } from '../position';

export default class MouseHandlers {
    public static handleMouseWheel(this: WorldMap, event: MouseWheelEvent): void {
        event.preventDefault();

        let needsRendering = false;

        const { x: currentX, y: currentY } = this.getMousePos(event);

        if (event.deltaY < 0) {
            needsRendering = this.zoomIn({ x: currentX, y: currentY });
        } else if (event.deltaY > 0) {
            needsRendering = this.zoomOut({ x: currentX, y: currentY });
        }

        if (needsRendering) {
            this.render();
        }
    }

    public static handleMouseDown(this: WorldMap, event: MouseEvent): void {
        event.preventDefault();

        const initialMousePos = this.getMousePos(event);
        this.lastMousePos = initialMousePos;
        this.isMouseDown = true;
        this.isDragging = false;
    }

    public static handleMouseMove(this: WorldMap, event: MouseEvent): void {
        // MouseMove event can be delayed by throttle and thus called after MouseLeave
        // so need to check if cursor is still inside canvas
        if (!this.isMouseInside) return;

        const mousePos = this.getMousePos(event);

        if (this.isMouseDown) {
            this.isDragging = true;
            this.handleMouseDrag(mousePos);
        } else {
            if (this.scale < this.hexagonThresholdScale) return;

            const cell = this.findCellFromPos(mousePos);
            if (this.hoveredCell !== undefined && this.hoveredCell !== cell) {
                this.onCellHoverOut?.call(this.hoveredCell, event);
                this.hoveredCell = undefined;
            }
            if (cell !== undefined && this.hoveredCell !== cell) {
                this.hoveredCell = cell;
                this.onCellHoverIn?.call(cell, event);
            }
        }
        this.render();
    }

    public static handleMouseDrag(this: WorldMap, pos: IPosition2d): void {
        if (this.movePosition(this.lastMousePos.x - pos.x, this.lastMousePos.y - pos.y)) {
            this.render();
        }

        this.lastMousePos = pos;
    }

    public static handleMouseUp(this: WorldMap, event: MouseEvent): void {
        this.isMouseDown = false;

        if (this.isDragging) {
            this.isDragging = false;

            const mousePos = this.getMousePos(event);

            this.handleMouseDrag(mousePos);
        } else {
            if (this.scale < this.hexagonThresholdScale) return;

            const mousePos = this.getMousePos(event);

            const cell = this.findCellFromPos(mousePos);
            const selectedCell = this.selectedCell;

            if (selectedCell !== undefined) {
                this.onCellDeselect?.call(selectedCell, event);
                this.selectedCell = undefined;
            }
            if (cell !== undefined && selectedCell !== cell) {
                this.onCellSelect?.call(cell, event);
                this.selectedCell = cell;
            }
        }
        this.render();
    }

    public static handleMouseEnter(this: WorldMap, _event: MouseEvent): void {
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.isMouseInside = true;
    }

    public static handleMouseLeave(this: WorldMap, event: MouseEvent): void {
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        if (this.hoveredCell !== undefined) {
            this.onCellHoverOut?.call(this.hoveredCell, event);
            this.hoveredCell = undefined;
        }
        this.isMouseInside = false;
        this.render();
    }
}
