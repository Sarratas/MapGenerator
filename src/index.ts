import { WorldMap, IGenerationParams } from './map';
import './styles/index.scss';
import { Path } from './path';

let canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap | undefined;
let activePath: Path | undefined;
const mapSize = 1000;

window.addEventListener('DOMContentLoaded', function() {
    let generateButton = document.getElementById('generate') as HTMLButtonElement;
    let calcPathButton = document.getElementById('calcPath') as HTMLButtonElement;

    generateButton.addEventListener('click', function(event) {
        event.preventDefault();

        let ctx = canvas.getContext('2d')!;

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
        if (map === undefined) return;

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

        if (activePath !== undefined) {
            activePath.hide();
        }

        activePath = map.calculatePath(startX, startY, endX, endY);

        if (activePath !== undefined) {
            activePath.show();

            let pathCostInput = document.getElementById('pathCost') as HTMLInputElement;
            let pathRealCostInput = document.getElementById('pathRealCost') as HTMLInputElement;
            let pathCost = activePath.getCost();
            let pathRealCost = activePath.getRealCost();

            pathCostInput.value = pathCost.toString();
            pathRealCostInput.value = pathRealCost.toString();
        }

        map.render();
    });
});

function generateMap() {
    let params: Partial<IGenerationParams> = {};
    type NodeListOfInputs = NodeListOf<HTMLInputElement | HTMLSelectElement>;
    type StrOrUndef = string | undefined;
    let inputs = document.querySelectorAll('#generateForm input, #generateForm select') as NodeListOfInputs;

    type KeysOfType<T, U> = { [k in keyof T]: T[k] extends U ? k : never }[keyof T];

    for (let input of inputs) {
        let nameN: KeysOfType<IGenerationParams, number> = input.name as KeysOfType<IGenerationParams, number>;
        let nameS: KeysOfType<IGenerationParams, StrOrUndef> = input.name as KeysOfType<IGenerationParams, StrOrUndef>;

        if (input.value === '') continue;

        if (isNaN(+input.value)) {
            params[nameS] = input.value;
        } else {
            params[nameN] = parseFloat(input.value);
        }
    }

    map = new WorldMap(mapSize, mapSize, params);

    map.generate();

    map.initView(canvas);

    map.render();
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
        map.render();
    }
});

canvas.addEventListener('mousedown', function(event: MouseEvent): void {
    if (map === undefined) return;

    let initialMousePos = getMousePos(canvas, event);
    let lastX = initialMousePos.x;
    let lastY = initialMousePos.y;

    let handleMouseMove = function(event: MouseEvent): void {
        if (map === undefined) return;

        let mousePos = getMousePos(canvas, event);
        let currentX = mousePos.x;
        let currentY = mousePos.y;

        if (map.movePosition(lastX - currentX, lastY - currentY)) {
            map.render();
        }

        lastX = currentX;
        lastY = currentY;
    };

    let handleMouseUp = function(event: MouseEvent): void {
        if (map === undefined) return;

        let mousePos = getMousePos(canvas, event);
        let endX = mousePos.x;
        let endY = mousePos.y;

        if (map.movePosition(lastX - endX, lastY - endY)) {
            map.render();
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
