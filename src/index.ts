import { WorldMap, GenerationParams } from './Map';
import { CellType } from './Cell';
import './styles/index.scss';

let canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap = undefined;
const mapSize = 1000;

window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generate').addEventListener('click', function(event) {
        event.preventDefault();
        
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

        interface pathFormElements extends HTMLFormControlsCollection {
            startX: HTMLInputElement;
            startY: HTMLInputElement;
            endX: HTMLInputElement;
            endY: HTMLInputElement;
        }

        let form: HTMLFormElement = document.getElementById('calcPathForm') as HTMLFormElement;
        let formElements: pathFormElements = form.elements as pathFormElements;
        let startX: number = +formElements.startX.value;
        let startY: number = +formElements.startY.value;

        let endX: number = +formElements.endX.value;
        let endY: number = +formElements.endY.value;

        let path = map.calculatePath(startX, startY, endX, endY)

        for (let cell of path) {
            cell.type = CellType.Placeholder;
        }
        
        map.render(canvas);
    });
});

function generateMap() {
    let params: GenerationParams = <GenerationParams>{};
    let inputs = document.querySelectorAll('#generateForm input, #generateForm select') as NodeListOf<HTMLInputElement | HTMLSelectElement>;

    type KeysOfType<T, U> = { [k in keyof T]: T[k] extends U ? k : never }[keyof T];

    for (let input of inputs) {
        let name: KeysOfType<GenerationParams, number> = input.name as KeysOfType<GenerationParams, number>;
        params[name] = parseFloat(input.value);
    }

    map = new WorldMap(mapSize, mapSize, params);

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