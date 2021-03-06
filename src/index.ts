import { WorldMap, MapMode } from './map/worldMap';
import { IGenerationParams, WorldMapGenerator } from './map/worldMapGenerator';
import './styles/index.scss';
import { Path } from './map/path';

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap | undefined;
let activePath: Path | undefined;
const mapWidth = 1000;
const mapHeight = 1000;
type KeysOfType<T, U> = { [k in keyof T]: T[k] extends U ? k : never }[keyof T];

const nations = [
    { id: 0, name: 'AAA', color: '#e6194b' },
    { id: 1, name: 'BBB', color: '#3cb44b' },
    { id: 2, name: 'CCC', color: '#ffe119' },
    { id: 3, name: 'DDD', color: '#f58231' },
    { id: 4, name: 'EEE', color: '#911eb4' },
    { id: 5, name: 'FFF', color: '#46f0f0' },
    { id: 6, name: 'GGG', color: '#f032e6' },
    { id: 7, name: 'HHH', color: '#bcf60c' },
    { id: 8, name: 'III', color: '#fabebe' },
    { id: 9, name: 'JJJ', color: '#008080' },
];

window.addEventListener('DOMContentLoaded', function(): void {
    const generateButton = document.getElementById('generate') as HTMLButtonElement;
    const calcPathButton = document.getElementById('calcPath') as HTMLButtonElement;
    const changeModeForm = document.getElementById('changeMode') as HTMLFormElement;

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

    changeModeForm.addEventListener('click', function(event: MouseEvent): void {
        const target = event.target as HTMLButtonElement;

        switch (target.id) {
            case 'modeTerrain':
                map?.setMapMode(MapMode.Terrain);
                break;
            case 'modePolitical':
                map?.setMapMode(MapMode.Political);
                break;
            default:
                break;
        }
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

    const generator = new WorldMapGenerator(generationParams);
    const generatedCells = generator.generate(mapWidth, mapHeight);

    // set test nations
    generatedCells.forEach(elements => elements.forEach(cell => {
        cell.nation = nations[(Math.floor(cell.pos.x / 10) + Math.floor((cell.pos.y) / 10) * 3) % 10];
    }));

    map = new WorldMap(mapWidth, mapHeight);
    map.loadCellsData(generatedCells, mapWidth, mapHeight);
    map.initView(canvas);

    map.render();
}
