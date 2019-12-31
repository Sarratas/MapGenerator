export enum CellTypes {
    None = 0,
    Plain = 1,
    Highland = 2,
    Mountain = 4,
    Land = Plain | Highland | Mountain,

    ShallowWater = 128,
    DeepWater = 256,
    Water = ShallowWater | DeepWater,

    Placeholder = 4096,
}

export enum CellColor {
    None = '#FFFFFF',
    Mountain = '#A47666',
    ShallowWater = '#1A9DCE',
    Plain = '#64815C',
    Highland = '#D2BC8D',
    DeepWater = '#1587BE',

    Placeholder = '#336633',
}

export enum OffsetRows {
    First = 65,
    Second = 244,
    Third = 430,
}

export enum OffsetColumns {
    First = 45,
    Second = 135,
    Third = 230,
    Fourth = 323,
    Fifth = 418,
    Sixth = 512,
    Seventh = 605,
    Eight = 700,
}

export enum MovementCosts {
    Easy = 1,
    Medium = 2,
    Hard = 4,
    Impossible = Infinity,
}

export const hoverImages = { // Placeholders
    [CellTypes.Plain]: 'https://i.pinimg.com/originals/03/08/e0/0308e0f4aa9d79ff5a7049eede9641bd.jpg',
    [CellTypes.Highland]: 'https://cdna.artstation.com/p/assets/images/images/011/375/136/large/alayna-lemmer-danner-1-plains.jpg?1529273570',
    [CellTypes.Mountain]: 'https://danbooru.donmai.us/data/__magic_the_gathering_drawn_by_alayna_danner__0c9c323f7dbe73d039466d7ac78de593.jpg?download=1',
    [CellTypes.Water]: 'https://i.etsystatic.com/17930715/r/il/7d01ba/1580305623/il_570xN.1580305623_g52u.jpg',
    [CellTypes.DeepWater]: 'https://i.pinimg.com/originals/65/77/a6/6577a6d3453ae41b1bdb8b76d303de28.jpg',
};

export enum HighlightModifiers {
    None    = 0x00,
    Path    = 0x01,
    Hover   = 0x02,
    Select  = 0x04,
}

export enum HighlightColors {
    None    = '',
    Path    = '#000000',
    Hover   = '#606060',
    Select  = '#CC00CC',
}
