import { JSONSchema7 } from "json-schema";

// biome-ignore lint/complexity/noStaticOnlyClass:
export class ConfigSchema {
    /* eslint-disable @typescript-eslint/naming-convention */
    public static readonly schema: JSONSchema7 = {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
            general: {
                type: "object",
                properties: {
                    enabled: { type: "boolean" },
                    useColorConverter: { type: "boolean" },
                    debug: { type: "boolean" },
                },
                required: ["enabled", "useColorConverter", "debug"],
            },
            penetration: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        range: {
                            type: "object",
                            properties: {
                                max: { type: "integer" },
                                min: { type: "integer" },
                            },
                            required: ["max", "min"],
                        },
                        colour: {
                            type: "object",
                            properties: {
                                high: {
                                    anyOf: [
                                        {
                                            enum: [
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
                                            ],
                                        },
                                        {
                                            type: "string",
                                            pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
                                        },
                                    ],
                                },
                                low: {
                                    type: "string",
                                    pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
                                },
                            },
                            required: ["high", "low"],
                        },
                    },
                    required: ["range", "colour"],
                },
            },
        },
        required: ["general", "penetration"],
    };
    /* eslint-enable @typescript-eslint/naming-convention */
}
