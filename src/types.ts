export const validBackgroundColors = [
    'black',
    'blue',
    'default',
    'green',
    'orange',
    'red',
    'tracerGreen',
    'tracerRed',
    'tracerYellow',
    'violet',
    'yellow',
] as const;

export type BackgroundColor = (typeof validBackgroundColors)[number];

export type PenetrationConfig = {
    minPenetration: number;
    backgroundColor: BackgroundColor;
};

export type Configuration = {
    enabled: boolean;
    debug: boolean;
    penetration: PenetrationConfig[];
};
