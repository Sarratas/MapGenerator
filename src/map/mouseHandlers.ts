import { WorldMap } from './worldMap';

export default class MouseHandlers {
    public static handleMouseWheel(this: WorldMap, event: MouseWheelEvent): void {
        event.preventDefault();

        let needsRendering = false;

        let mousePos = this.getMousePos(event);
        let currentX = mousePos.x;
        let currentY = mousePos.y;

        if (event.deltaY < 0) {
            needsRendering = this.zoomIn(currentX, currentY);
        } else if (event.deltaY > 0) {
            needsRendering = this.zoomOut(currentX, currentY);
        }

        if (needsRendering) {
            this.render();
        }
    }

    public static handleMouseDown(this: WorldMap, event: MouseEvent): void {
        event.preventDefault();

        let initialMousePos = this.getMousePos(event);
        this.lastMouseX = initialMousePos.x;
        this.lastMouseY = initialMousePos.y;
        this.isMouseDown = true;
        this.isDragging = false;
    }

    public static handleMouseMove(this: WorldMap, event: MouseEvent): void {
        // MouseMove event can be delayed by throttle and thus called after MouseLeave
        // so need to check if cursor is still inside canvas
        if (!this.isMouseInside) return;

        const mousePos = this.getMousePos(event);
        const currentX = mousePos.x;
        const currentY = mousePos.y;

        if (this.isMouseDown) {
            this.isDragging = true;
            this.handleMouseDrag(currentX, currentY);
        } else {
            if (this.scale < this.hexagonThresholdScale) return;

            const cell = this.findCellFromCoords(currentX, currentY);
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

    public static handleMouseDrag(this: WorldMap, currentX: number, currentY: number): void {
        if (this.movePosition(this.lastMouseX - currentX, this.lastMouseY - currentY)) {
            this.render();
        }

        this.lastMouseX = currentX;
        this.lastMouseY = currentY;
    }

    public static handleMouseUp(this: WorldMap, event: MouseEvent): void {
        this.isMouseDown = false;

        if (this.isDragging) {
            this.isDragging = false;

            let mousePos = this.getMousePos(event);
            let endX = mousePos.x;
            let endY = mousePos.y;

            this.handleMouseDrag(endX, endY);
        } else {
            if (this.scale < this.hexagonThresholdScale) return;

            const mousePos = this.getMousePos(event);
            const currentX = mousePos.x;
            const currentY = mousePos.y;

            const cell = this.findCellFromCoords(currentX, currentY);
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
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isMouseInside = true;
    }

    public static handleMouseLeave(this: WorldMap, event: MouseEvent): void {
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        if (this.hoveredCell !== undefined) {
            this.onCellHoverOut?.call(this.hoveredCell, event);
            this.hoveredCell = undefined;
        }
        this.isMouseInside = false;
        this.render();
    }
}
