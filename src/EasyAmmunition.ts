import * as fs from "node:fs";
import * as path from "node:path";
import type { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import type { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { DependencyContainer } from "tsyringe";
import { AmmunitionAdjuster } from "./adjusters/AmmunitionAdjuster";
import { ConfigServer } from "./servers/ConfigServer";
import type { Configuration } from "./types";

class EasyAmmunition implements IPostDBLoadMod, IPreSptLoadMod {
    public config: Configuration | null = null;

    /**
     * Handle loading the configuration file and registering our custom MatchCallbacks class.
     * Runs before the database is loaded.
     */
    public preSptLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");

        // Load and validate the configuration file.
        try {
            this.config = new ConfigServer().loadConfig().validateConfig().getConfig();
        } catch (error: unknown) {
            this.config = null; // Set the config to null so we know it's failed to load or validate.
            logger.log(`EasyAmmunition: ${(error as Error).message}`, "red");
        }

        // Set a flag so we know that we shouldn't continue when the postDBLoad method fires... just setting the config
        // back to null should do the trick. Use optional chaining because we have not yet checked if the config is
        // loaded and valid yet.
        if (this.config?.general?.enabled === false) {
            this.config = null;
            logger.log("EasyAmmunition is disabled in the config file.", "red");
        }

        // If the configuration is null at this point we can stop here.
        if (this.config === null) {
            return;
        }

        // Check and store whether Color Converter is available or not.
        this.config.general.canUseColorConverter = false;
        if (this.config.general.useColorConverter) {
            this.config.general.canUseColorConverter = this.isColourConverterAvailable();
            if (this.config.general.canUseColorConverter) {
                logger.log("EasyAmmunition: Color Converter mod installed. Hex colour values are enabled.", "cyan");
            } else {
                logger.log(
                    "EasyAmmunition: Color Converter mod not found. Only vanilla EFT colours are enabled.",
                    "yellow",
                );
            }
        } else {
            logger.log(
                "EasyAmmunition: Color Converter compatibility has been manually disabled in the configuration file.",
                "yellow",
            );
        }
    }

    /**
     * Trigger the changes to extracts once the database has loaded.
     */
    public postDBLoad(container: DependencyContainer): void {
        // If the configuration is null at this point we can stop here. This will happen if the configuration file
        // failed to load, failed to validate, or if the mod is disabled in the configuration file.
        if (this.config === null) {
            return;
        }

        // Modify the ammunition based on the configuration.
        new AmmunitionAdjuster(container, this.config).adjustBackgroundColour();
    }

    /**
     * Check if the Color Converter server-plugin is available.
     */
    private isColourConverterAvailable(): boolean {
        const pluginName = "RaiRai.ColorConverterAPI.dll".toLowerCase();
        const pluginDir = path.resolve(__dirname, "..", "..", "..", "..", "BepInEx", "plugins");

        try {
            const pluginList = fs.readdirSync(pluginDir).map((plugin) => plugin.toLowerCase());
            return pluginList.includes(pluginName);
        } catch {
            return false;
        }
    }
}

module.exports = { mod: new EasyAmmunition() };
