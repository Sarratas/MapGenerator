import { WorldMap, IGenerationParams } from './map';
import { CellType } from './cell';
import './styles/index.scss';

let canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap;
const mapSize = 1000;

window.addEventListener('DOMContentLoaded', function() {
    let generateButton = document.getElementById('generate');
    let calcPathButton = document.getElementById('calcPath');

    generateButton.addEventListener('click', function(event) {
        event.preventDefault();

        let ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '20px Georgia';
        ctx.fillStyle = '#000000';

        let loadingText = 'Generating new map...';
        let loadingTextWidth = ctx.measureText(loadingText).width;

        const topOffset = 490;
        const generationTimeout = 100;

        ctx.fillText(loadingText , canvas.width / 2 - loadingTextWidth / 2, topOffset);

        setTimeout(generateMap, generationTimeout);
    });

    calcPathButton.addEventListener('click', function(event) {
        event.preventDefault();

        interface IPathFormElements extends HTMLFormControlsCollection {
            startX: HTMLInputElement;
            startY: HTMLInputElement;
            endX: HTMLInputElement;
            endY: HTMLInputElement;
        }

        let form: HTMLFormElement = document.getElementById('calcPathForm') as HTMLFormElement;
        let formElements: IPathFormElements = form.elements as IPathFormElements;
        let startX: number = +formElements.startX.value;
        let startY: number = +formElements.startY.value;

        let endX: number = +formElements.endX.value;
        let endY: number = +formElements.endY.value;

        let path = map.calculatePath(startX, startY, endX, endY);

        for (let cell of path) {
            cell.type = CellType.Placeholder;
        }

        map.render(canvas);
    });
});

function generateMap() {
    let params: IGenerationParams = {};
    type NodeListOfInputs = NodeListOf<HTMLInputElement | HTMLSelectElement>;
    let inputs = document.querySelectorAll('#generateForm input, #generateForm select') as NodeListOfInputs;

    type KeysOfType<T, U> = { [k in keyof T]: T[k] extends U ? k : never }[keyof T];

    for (let input of inputs) {
        let name: KeysOfType<IGenerationParams, number> = input.name as KeysOfType<IGenerationParams, number>;
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

    let mousePos = getMousePos(canvas, event);
    let currentX = mousePos.x;
    let currentY = mousePos.y;

    if (event.deltaY < 0) {
        needsRendering = map.zoomIn(currentX, currentY);
    } else if (event.deltaY > 0) {
        needsRendering = map.zoomOut(currentX, currentY);
    }

    if (needsRendering) {
        map.render(canvas);
    }
});

canvas.addEventListener('mousedown', function(event: MouseEvent): void {
    if (map === undefined) {
        return;
    }

    let initialMousePos = getMousePos(canvas, event);
    let lastX = initialMousePos.x;
    let lastY = initialMousePos.y;

    let handleMouseMove = function(event: MouseEvent): void {
        let mousePos = getMousePos(canvas, event);
        let currentX = mousePos.x;
        let currentY = mousePos.y;

        if (map.movePosition(lastX - currentX, lastY - currentY)) {
            map.render(canvas);
        }

        lastX = currentX;
        lastY = currentY;
    };

    let handleMouseUp = function(event: MouseEvent): void {
        let mousePos = getMousePos(canvas, event);
        let endX = mousePos.x;
        let endY = mousePos.y;

        if (map.movePosition(lastX - endX, lastY - endY)) {
            map.render(canvas);
        }

        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
});

function getMousePos(canvas: HTMLCanvasElement, event: MouseEvent) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
}
