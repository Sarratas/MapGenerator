import { WorldMap, IGenerationParams } from './map/worldMap';
import './styles/index.scss';
import { Path } from './path';

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap | undefined;
let activePath: Path | undefined;
const mapWidth = 1000;
const mapHeight = 1000;
type KeysOfType<T, U> = { [k in keyof T]: T[k] extends U ? k : never }[keyof T];

window.addEventListener('DOMContentLoaded', function(): void {
    const generateButton = document.getElementById('generate') as HTMLButtonElement;
    const calcPathButton = document.getElementById('calcPath') as HTMLButtonElement;

    generateButton.addEventListener('click', function(event: MouseEvent): void {
        event.preventDefault();

        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '20px Georgia';
        ctx.fillStyle = '#000000';

        const loadingText = 'Generating new map...';
        const loadingTextWidth = ctx.measureText(loadingText).width;

        const topOffset = 490;
        const generationTimeout = 100;

        ctx.fillText(loadingText , canvas.width / 2 - loadingTextWidth / 2, topOffset);

        setTimeout(generateMap, generationTimeout);
    });

    calcPathButton.addEventListener('click', function(event: MouseEvent): void {
        if (map === undefined) return;

        event.preventDefault();

        interface IPathFormElements extends HTMLFormControlsCollection {
            startX: HTMLInputElement;
            startY: HTMLInputElement;
            endX: HTMLInputElement;
            endY: HTMLInputElement;
        }

        const form: HTMLFormElement = document.getElementById('calcPathForm') as HTMLFormElement;
        const formElements: IPathFormElements = form.elements as IPathFormElements;
        const startX: number = +formElements.startX.value;
        const startY: number = +formElements.startY.value;

        const endX: number = +formElements.endX.value;
        const endY: number = +formElements.endY.value;

        if (activePath !== undefined) {
            activePath.hide();
        }

        activePath = map.calculatePath(startX, startY, endX, endY);

        if (activePath !== undefined) {
            activePath.show();

            const pathCostInput = document.getElementById('pathCost') as HTMLInputElement;
            const pathRealCostInput = document.getElementById('pathRealCost') as HTMLInputElement;
            const pathCost = activePath.getCost();
            const pathRealCost = activePath.getRealCost();

            pathCostInput.value = pathCost.toString();
            pathRealCostInput.value = pathRealCost.toString();
        }

        map.render();
    });
});

function generateMap(): void {
    const generationParams: Partial<IGenerationParams> = {};
    type NodeListOfInputs = NodeListOf<HTMLInputElement | HTMLSelectElement>;
    type StrOrUndef = string | undefined;
    const inputs = document.querySelectorAll('#generateForm input, #generateForm select') as NodeListOfInputs;

    for (const input of inputs) {
        const nameNum: KeysOfType<IGenerationParams, number> = input.name as KeysOfType<IGenerationParams, number>;
        const name: KeysOfType<IGenerationParams, StrOrUndef> = input.name as KeysOfType<IGenerationParams, StrOrUndef>;

        if (input.value === '') continue;

        if (isNaN(+input.value)) {
            generationParams[name] = input.value;
        } else {
            generationParams[nameNum] = parseFloat(input.value);
        }
    }

    if (map !== undefined) {
        map.unbindView();
        map = undefined;
    }
    map = new WorldMap(mapWidth, mapHeight, generationParams);

    map.generate();

    map.initView(canvas);

    map.render();
}
