import { WorldMap } from './Map.js';
import { CellType } from './Cell.js';

let canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap = undefined;
const mapSize = 1000;

window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generate').addEventListener('click', function(event) {
        
        let ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = "20px Georgia";
        ctx.fillStyle = '#000000';

        let loadingText = "Generating new map...";
        let loadingTextWidth = ctx.measureText(loadingText).width;
        
        const topOffset = 490;
        const generationTimeout = 100;

        ctx.fillText(loadingText , canvas.width / 2 - loadingTextWidth / 2, topOffset);

        setTimeout(generateMap, generationTimeout);
    });

    document.getElementById('calcPath').addEventListener('click', function(event) {
        event.preventDefault();
        let form: HTMLFormElement = document.getElementById('calcPathForm') as HTMLFormElement;
        let startX = form.elements['startX'].value;
        let startY = form.elements['startY'].value;

        let endX = form.elements['endX'].value;
        let endY = form.elements['endY'].value;

        let path = map.calculatePath(startX, startY, endX, endY);

        for (let cell of path) {
            cell.type = CellType.Placeholder;
        }
        
        map.render(canvas);
    });
});

function generateMap() {
    map = new WorldMap(mapSize, mapSize);

    map.generate();

    map.render(canvas);
}

canvas.addEventListener('wheel', function(event: MouseWheelEvent) {
    if (map === undefined) {
        return;
    }

    event.preventDefault();

    let needsRendering = false;

    if (event.deltaY < 0) {
        needsRendering = map.zoomIn();
    } else if (event.deltaY > 0) {
        needsRendering = map.zoomOut();
    }

    if (needsRendering) {
        map.render(canvas);
    }
});

canvas.addEventListener('mousedown', function(event: MouseEvent): void {
    if (map === undefined) {
        return;
    }

    let lastX = event.screenX;
    let lastY = event.screenY;

    let handleMouseMove = function(event: MouseEvent): void {
        let currentX = event.screenX;
        let currentY = event.screenY;

        if (map.movePosition(currentX - lastX, currentY - lastY)) {
            map.render(canvas);
        }

        lastX = currentX;
        lastY = currentY;
    }

    let handleMouseUp = function(event: MouseEvent): void {
        let endX = event.screenX;
        let endY = event.screenY;

        if (map.movePosition(endX - lastX, endY - lastY)) {
            map.render(canvas);
        }

        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
});