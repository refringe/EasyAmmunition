export type RGB = {
    r: number;
    g: number;
    b: number;
};

export const validBackgroundColours = [
    "black",
    "blue",
    "default",
    "green",
    "orange",
    "red",
    "tracerGreen",
    "tracerRed",
    "tracerYellow",
    "violet",
    "yellow",
] as const;

export type BackgroundColor = (typeof validBackgroundColours)[number];
export type ExtendedBackgroundColour = BackgroundColor | string; // Extend to include HEX color codes (string)

export type PenetrationRange = {
    max: number;
    min: number;
};

export type ColorGradient = {
    start: ExtendedBackgroundColour;
    end: string;
};

export type PenetrationConfig = {
    range: PenetrationRange;
    colour: ColorGradient;
};

export type GeneralSettings = {
    enabled: boolean;
    useColorConverter: boolean;
    debug: boolean;
};

export type Configuration = {
    general: GeneralSettings;
    penetration: PenetrationConfig[];
};
