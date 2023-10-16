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

    private linearInterpolation(start: number, end: number, amt: number): number {
        if (amt < 0 || amt > 1) {
            throw new Error("INVALID_INTERPOLATION_AMOUNT - Linear interpolation amount should be between 0 and 1.");
        }
        return (1 - amt) * start + amt * end;
    }

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

    private RGBToHex(rgb: RGB): string {
        return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
    }

    private isHexColour(colour: string): boolean {
        return /^#([0-9A-F]{3}){1,2}$/i.test(colour);
    }

    private isVanillaColour(colour: string): boolean {
        return this.VANILLA_COLOURS.includes(colour);
    }

    private convertVanillaColour(colour: string): string {
        return this.VANILLA_COLOUR_TO_HEX[colour] || "#000000"; // Default to black
    }

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

    private calculateColour(
        penetration: number,
        config: PenetrationConfig,
        colorConverter: boolean
    ): ExtendedBackgroundColour {
        const { range, colour } = config;

        if (colorConverter && EasyAmmunition.config.general.useColorConverter) {
            const startColour = this.isVanillaColour(colour.start)
                ? this.convertVanillaColour(colour.start)
                : colour.start;
            const amt = (penetration - range.min) / (range.max - range.min);
            return this.interpolateColours(startColour, colour.end, amt).toUpperCase();
        }

        if (this.isHexColour(colour.start)) {
            throw new Error(`Colour ${colour.start} cannot be used without Color Converter API installed.`);
        }

        if (this.isVanillaColour(colour.start)) {
            return colour.start;
        }

        return "black"; // Default colour
    }

    private interpolateColours(startHex: string, endHex: string, amt: number): ExtendedBackgroundColour {
        const startRGB = this.hexToRGB(startHex);
        const endRGB = this.hexToRGB(endHex);
        const interpolatedRGB = this.colourInterpolation(startRGB, endRGB, amt);
        return this.RGBToHex(interpolatedRGB);
    }
}
