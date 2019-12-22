import { WorldMap, IGenerationParams, IWorldMapParams } from './map';
import './styles/index.scss';
import { Path } from './path';
import { Cell, CellTypes } from './cell';

let canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let map: WorldMap | undefined;
let activePath: Path | undefined;
const mapWidth = 1000;
const mapHeight = 1000;
let lastCell: Cell | undefined;
type KeysOfType<T, U> = { [k in keyof T]: T[k] extends U ? k : never }[keyof T];

const imgs = { // Placeholders
    [CellTypes.Plain]: 'https://i.pinimg.com/originals/03/08/e0/0308e0f4aa9d79ff5a7049eede9641bd.jpg',
    [CellTypes.Highland]: 'https://cdna.artstation.com/p/assets/images/images/011/375/136/large/alayna-lemmer-danner-1-plains.jpg?1529273570',
    [CellTypes.Mountain]: 'https://danbooru.donmai.us/data/__magic_the_gathering_drawn_by_alayna_danner__0c9c323f7dbe73d039466d7ac78de593.jpg?download=1',
    [CellTypes.Water]: 'https://i.etsystatic.com/17930715/r/il/7d01ba/1580305623/il_570xN.1580305623_g52u.jpg',
    [CellTypes.DeepWater]: 'https://i.pinimg.com/originals/65/77/a6/6577a6d3453ae41b1bdb8b76d303de28.jpg',
};

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
    let generationParams: Partial<IGenerationParams> = {};
    type NodeListOfInputs = NodeListOf<HTMLInputElement | HTMLSelectElement>;
    type StrOrUndef = string | undefined;
    let inputs = document.querySelectorAll('#generateForm input, #generateForm select') as NodeListOfInputs;

    for (let input of inputs) {
        let nameN: KeysOfType<IGenerationParams, number> = input.name as KeysOfType<IGenerationParams, number>;
        let nameS: KeysOfType<IGenerationParams, StrOrUndef> = input.name as KeysOfType<IGenerationParams, StrOrUndef>;

        if (input.value === '') continue;

        if (isNaN(+input.value)) {
            generationParams[nameS] = input.value;
        } else {
            generationParams[nameN] = parseFloat(input.value);
        }
    }

    const worldMapParams: IWorldMapParams = {
        onCellHover: onCellHover,
        onCellClick: onCellClick,
    };

    map = new WorldMap(mapWidth, mapHeight, generationParams, worldMapParams);

    map.generate();

    map.initView(canvas);

    map.render();
}

function onCellHover(this: Cell, event: MouseEvent) {
    const tooltip = document.getElementById('cellHoverInfo')!;
    tooltip.style.left = event.clientX + 'px';
    tooltip.style.top = event.clientY + 'px';
    tooltip.hidden = false;
    if (lastCell !== this) {
        lastCell = this;
        const elemsToUpdate = tooltip.querySelectorAll('.tooltipContent') as NodeListOf<HTMLElement>;
        for (let elem of elemsToUpdate) {
            const content = elem.dataset['content']! as keyof Cell;
            elem.innerHTML = this[content]?.toString() ?? '';
        }
        tooltip.querySelector('img')!.src = imgs[this.type];
    }
}

function onCellClick(this: Cell/*, event: MouseEvent*/) {

}