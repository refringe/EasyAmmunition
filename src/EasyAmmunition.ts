import type { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import * as fs from "fs";
import * as path from "path";
import { DependencyContainer } from "tsyringe";
import { AmmunitionAdjuster } from "./adjusters/AmmunitionAdjuster";
import { ConfigServer } from "./servers/ConfigServer";
import type { Configuration } from "./types";

export class EasyAmmunition implements IPostDBLoadMod, IPreAkiLoadMod {
    public static container: DependencyContainer;
    public static logger: ILogger;
    public static config: Configuration | null = null;
    public static colorConverter = false;

    /**
     * Handle loading the configuration file and registering our custom MatchCallbacks class.
     * Runs before the database is loaded.
     */
    public preAkiLoad(container: DependencyContainer): void {
        EasyAmmunition.container = container;

        // Resolve the logger and save it to the static logger property for simple access.
        EasyAmmunition.logger = container.resolve<ILogger>("WinstonLogger");

        // Check and store whether Color Converter is available or not.
        if (EasyAmmunition.config.general.useColorConverter) {
            EasyAmmunition.colorConverter = this.isColourConverterAvailable();
            if (EasyAmmunition.colorConverter) {
                EasyAmmunition.logger.log(
                    `EasyAmmunition: Color Converter mod installed. Hex colour values are enabled.`,
                    "cyan"
                );
            } else {
                EasyAmmunition.logger.log(
                    `EasyAmmunition: Color Converter mod not found. Only vanilla EFT colours are enabled.`,
                    "yellow"
                );
            }
        } else {
            EasyAmmunition.logger.log(
                `EasyAmmunition: Color Converter compatibility has been manually disabled in the configuration file.`,
                "yellow"
            );
        }

        // Load and validate the configuration file, saving it to the static config property for simple access.
        try {
            EasyAmmunition.config = new ConfigServer().loadConfig().validateConfig().getConfig();
        } catch (error: any) {
            EasyAmmunition.config = null; // Set the config to null so we know it's failed to load or validate.
            EasyAmmunition.logger.log(`EasyAmmunition: ${error.message}`, "red");
        }

        // Set a flag so we know that we shouldn't continue when the postDBLoad method fires... just setting the config
        // back to null should do the trick. Use optional chaining because we have not yet checked if the config is
        // loaded and valid yet.
        if (EasyAmmunition.config?.general?.enabled === false) {
            EasyAmmunition.config = null;
            EasyAmmunition.logger.log("EasyAmmunition is disabled in the config file.", "red");
        }

        // If the configuration is null at this point we can stop here.
        if (EasyAmmunition.config === null) {
            return;
        }
    }

    /**
     * Trigger the changes to extracts once the database has loaded.
     */
    public postDBLoad(): void {
        // If the configuration is null at this point we can stop here. This will happen if the configuration file
        // failed to load, failed to validate, or if the mod is disabled in the configuration file.
        if (EasyAmmunition.config === null) {
            return;
        }

        // Modify the ammunition based on the configuration.
        new AmmunitionAdjuster();
    }

    /**
     * Check if the Color Converter server-plugin is available.
     */
    private isColourConverterAvailable(): boolean {
        const pluginName = "RaiRai.ColorConverterAPI.dll".toLowerCase();
        const pluginDir = path.resolve(__dirname, "..", "..", "..", "..", "BepInEx", "plugins");

        try {
            const pluginList = fs.readdirSync(pluginDir).map(plugin => plugin.toLowerCase());
            return pluginList.includes(pluginName);
        } catch {
            return false;
        }
    }
}

module.exports = { mod: new EasyAmmunition() };
