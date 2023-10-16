import type { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import type { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { EasyAmmunition } from "../EasyAmmunition";
import type { ExtendedBackgroundColour, PenetrationConfig, RGB } from "./../types";
import { validBackgroundColours } from "./../types";

/**
 * The `AmmunitionAdjuster` class is responsible for orchestrating adjustments to game ammunition according to a
 * predefined configuration file.
 */
export class AmmunitionAdjuster {
    private readonly AMMO_PARENT_NAME = "Ammo";
    private readonly BULLET_TYPE = "bullet";
    private readonly BUCKSHOT_TYPE = "buckshot";
    private readonly VANILLA_COLOURS: readonly string[] = validBackgroundColours;
    private readonly VANILLA_COLOUR_TO_HEX: Record<string, string> = {
        blue: "#003366",
        default: "#666666",
        green: "#336600",
        orange: "#993300",
        red: "#660000",
        tracerGreen: "#00cc00",
        tracerRed: "#ff0000",
        tracerYellow: "#ffff00",
        violet: "#330066",
        yellow: "#666600",
        black: "#000000",
    };

    /**
     * Make the adjustments to the ammunition once the class is instantiated.
     */
    constructor() {
        this.adjustBackgroundColour();
    }

    /**
     * Adjusts the background colour of ammunition items based on their penetration power.
     *
     * This method performs the following steps:
     * 1. Resolves the `DatabaseServer` and fetches all game items.
     * 2. Finds the parent ID for ammunition items.
     * 3. Filters out valid ammunition items based on certain properties like `_parent`, `_props`, and `_name`.
     * 4. Iterates through the valid items, modifying their `BackgroundColor` property based on their penetration power.
     * 5. Logs the number of items whose background colour has been adjusted.
     *
     * @returns {void}
     */
    private adjustBackgroundColour(): void {
        const items: Record<string, ITemplateItem> = EasyAmmunition.container
            .resolve<DatabaseServer>("DatabaseServer")
            .getTables().templates.items;
        const itemValues = Object.values(items);

        // Get the ammunition item parent ID.
        const parentAmmo = itemValues.find(item => item._name === this.AMMO_PARENT_NAME);
        if (!parentAmmo) {
            EasyAmmunition.logger.log(
                "EasyAmmunition: Parent ammo ID not found. Something has gone terribly wrong. No changes made.",
                "red"
            );
            return;
        }

        if (EasyAmmunition.config.general.debug) {
            EasyAmmunition.logger.log(`EasyAmmunition: Parent ammo ID found: ${parentAmmo._id}.`, "gray");
        }

        let changeCount = 0;

        const validItems = itemValues.filter(
            item =>
                item._parent === parentAmmo._id &&
                item._props?.ammoType &&
                item._props?.PenetrationPower &&
                item._props?.BackgroundColor &&
                !item._name.startsWith("shrapnel") &&
                (item._props.ammoType === this.BULLET_TYPE || item._props.ammoType === this.BUCKSHOT_TYPE)
        );

        validItems.forEach(item => {
            const penetration: number = item._props.PenetrationPower;

            try {
                item._props.BackgroundColor = this.resolveBackgroundColour(
                    penetration,
                    EasyAmmunition.config.penetration,
                    EasyAmmunition.colorConverter
                );
            } catch (e) {
                EasyAmmunition.logger.log(`EasyAmmunition: ${e.message}`, "red");
            }

            if (EasyAmmunition.config.general.debug) {
                EasyAmmunition.logger.log(
                    `EasyAmmunition: Ammo ${item._name} has pen value of ${penetration}. Set background colour to ${item._props.BackgroundColor}.`,
                    "gray"
                );
            }

            changeCount++;
        });

        EasyAmmunition.logger.log(
            `EasyAmmunition: Adjusted the background colour of ${changeCount} types of ammunition.`,
            "cyan"
        );
    }

    /**
     * Converts a HEX color string to its RGB representation.
     *
     * This method uses a regular expression to match valid 6-digit HEX color strings.
     * If the input string is valid, it splits the string into its R, G, and B components
     * and converts them to their decimal form.
     *
     * @param {string} hex - The HEX color string to be converted.
     * @returns {RGB} An object containing the R, G, and B values in decimal form.
     */
    private hexToRGB(hex: string): RGB {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 0, g: 0, b: 0 };
    }

    /**
     * Performs linear interpolation between two numbers.
     *
     * This method takes a starting number, an ending number, and an interpolation amount.
     * It calculates the value that is the specified interpolation amount between the start and end numbers.
     *
     * @param {number} start - The starting number.
     * @param {number} end - The ending number.
     * @param {number} amt - The interpolation amount, should be between 0 and 1.
     * @returns {number} The interpolated value.
     */
    private linearInterpolation(start: number, end: number, amt: number): number {
        if (amt < 0 || amt > 1) {
            throw new Error("INVALID_INTERPOLATION_AMOUNT - Linear interpolation amount should be between 0 and 1.");
        }
        return (1 - amt) * start + amt * end;
    }

    /**
     * Performs linear interpolation between two RGB colour values.
     *
     * This method takes two RGB objects, each specifying the red, green, and blue components of a colour,
     * as well as an interpolation amount. It calculates the RGB value that is the specified interpolation
     * amount between the two input colours.
     *
     * @param {RGB} colour1 - The first RGB colour object.
     * @param {RGB} colour2 - The second RGB colour object.
     * @param {number} amt - The interpolation amount, should be between 0 and 1.
     * @returns {RGB} The interpolated RGB colour object.
     */
    private colourInterpolation(colour1: RGB, colour2: RGB, amt: number): RGB {
        if (amt < 0 || amt > 1) {
            throw new Error("INVALID_INTERPOLATION_AMOUNT - Colour interpolation amount should be between 0 and 1.");
        }
        return {
            r: Math.round(this.linearInterpolation(colour1.r, colour2.r, amt)),
            g: Math.round(this.linearInterpolation(colour1.g, colour2.g, amt)),
            b: Math.round(this.linearInterpolation(colour1.b, colour2.b, amt)),
        };
    }

    /**
     * Converts an RGB colour object to its corresponding hexadecimal representation.
     *
     * This method takes an RGB object specifying the red, green, and blue components of a colour.
     * It returns a string representing the hexadecimal value of the colour, prefixed with '#'.
     *
     * @param {RGB} rgb - The RGB colour object.
     * @returns {string} The hexadecimal colour string, prefixed with '#'.
     */
    private RGBToHex(rgb: RGB): string {
        return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
    }

    /**
     * Validates whether a given string is a valid hexadecimal colour.
     *
     * This method takes a string as input and employs a regular expression to ascertain its format.
     * If the string conforms to a valid hexadecimal colour format, the method returns true; otherwise, it returns false.
     *
     * @param {string} colour - The colour string to validate.
     * @returns {boolean} Returns true if the string is a valid hexadecimal colour; false otherwise.
     */
    private isHexColour(colour: string): boolean {
        return /^#([0-9A-F]{3}){1,2}$/i.test(colour);
    }

    /**
     * Determines if a given colour string is a predefined 'vanilla' colour.
     *
     * This method checks the colour against a list of predefined vanilla colours.
     * The method returns true if the colour exists within the vanilla list, and false otherwise.
     *
     * @param {string} colour - The colour string to check.
     * @returns {boolean} Returns true if the colour is a vanilla colour; false otherwise.
     */
    private isVanillaColour(colour: string): boolean {
        return this.VANILLA_COLOURS.includes(colour);
    }

    /**
     * Converts a vanilla colour string to its corresponding HEX code.
     *
     * This method takes a vanilla colour as input and returns its corresponding HEX code.
     * If the input colour is not found in the predefined list of vanilla colours, it defaults to black.
     *
     * @param {string} colour - The vanilla colour string to convert.
     * @returns {string} Returns the HEX code of the given vanilla colour or defaults to black.
     */
    private convertVanillaColour(colour: string): string {
        return this.VANILLA_COLOUR_TO_HEX[colour] || "#000000"; // Default to black
    }

    /**
     * Resolves the background color for an ammunition item based on its penetration power.
     *
     * This method identifies the appropriate color range configuration for a given penetration power
     * and calculates the background color. It accounts for the presence or absence of an external color converter.
     * If no suitable configuration is found, it defaults to "black".
     *
     * @param {number} penetration - The penetration power of the ammunition.
     * @param {PenetrationConfig[]} configuration - Array of objects specifying color ranges for different penetration powers.
     * @param {boolean} colorConverter - Flag indicating the presence of an external color converter.
     * @returns {ExtendedBackgroundColour} Returns the calculated background color or defaults to "black".
     */
    private resolveBackgroundColour(
        penetration: number,
        configuration: PenetrationConfig[],
        colorConverter: boolean
    ): ExtendedBackgroundColour {
        const config = this.findConfigurationByPenetration(penetration, configuration);
        if (config) {
            return this.calculateColour(penetration, config, colorConverter);
        }
        return "black"; // Default colour
    }

    /**
     * Finds the appropriate PenetrationConfig object for a given penetration power from an array of PenetrationConfig objects.
     *
     * This method iterates through an array of PenetrationConfig objects to find the one whose range
     * encompasses the provided penetration power. If no suitable configuration is found, it returns null.
     *
     * @param {number} penetration - The penetration power of the ammunition.
     * @param {PenetrationConfig[]} configuration - Array of PenetrationConfig objects specifying color ranges for different penetration powers.
     * @returns {PenetrationConfig | null} Returns the matching PenetrationConfig object, or null if no match is found.
     */
    private findConfigurationByPenetration(
        penetration: number,
        configuration: PenetrationConfig[]
    ): PenetrationConfig | null {
        for (const config of configuration) {
            const { range } = config;
            if (penetration <= range.max && penetration >= range.min) {
                return config;
            }
        }
        return null;
    }

    /**
     * Calculates the background color for ammunition based on its penetration power and a given configuration.
     *
     * The method uses the `PenetrationConfig` object to determine the range of valid penetration powers and
     * the corresponding high and low color values. If the `colorConverter` flag and the global `useColorConverter`
     * configuration are both true, it interpolates between the high and low colors based on the ammunition's
     * penetration power. Otherwise, it returns the high color if it's a valid vanilla color, and throws an error
     * if it's a hex color.
     *
     * @param {number} penetration - The penetration power of the ammunition.
     * @param {PenetrationConfig} config - Configuration specifying color ranges for different penetration powers.
     * @param {boolean} colorConverter - Flag indicating whether the Color Converter API is available.
     * @returns {ExtendedBackgroundColour} The calculated background color.
     */
    private calculateColour(
        penetration: number,
        config: PenetrationConfig,
        colorConverter: boolean
    ): ExtendedBackgroundColour {
        const { range, colour } = config;

        if (colorConverter && EasyAmmunition.config.general.useColorConverter) {
            const highColour = this.isVanillaColour(colour.high) ? this.convertVanillaColour(colour.high) : colour.high;
            const amt = (penetration - range.min) / (range.max - range.min);
            return this.interpolateColours(highColour, colour.low, amt).toUpperCase();
        }

        if (this.isHexColour(colour.high)) {
            throw new Error(`Colour ${colour.high} cannot be used without Color Converter API installed.`);
        }

        if (this.isVanillaColour(colour.high)) {
            return colour.high;
        }

        return "black"; // Default colour
    }

    /**
     * Interpolates between two colors based on a given interpolation amount.
     *
     * Given two hex color strings and an interpolation amount, this method converts the hex colors to their RGB components,
     * performs color interpolation to find an intermediate color, and then converts this RGB color back to a hex string.
     *
     * @param {string} startHex - The starting color in hex format.
     * @param {string} endHex - The ending color in hex format.
     * @param {number} amt - The amount to interpolate between the two colors, a value between 0 and 1.
     * @returns {ExtendedBackgroundColour} The interpolated color in hex format.
     */
    private interpolateColours(startHex: string, endHex: string, amt: number): ExtendedBackgroundColour {
        const startRGB = this.hexToRGB(startHex);
        const endRGB = this.hexToRGB(endHex);
        const interpolatedRGB = this.colourInterpolation(startRGB, endRGB, amt);
        return this.RGBToHex(interpolatedRGB);
    }
}
