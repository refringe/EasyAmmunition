import { DependencyContainer } from "tsyringe";
import type { IPostDBLoadModAsync } from "@spt-aki/models/external/IPostDBLoadModAsync";
import { loadConfiguration, validateConfiguration } from "./config";
import { adjustAmmunition } from "./ammunition";
import { getLogger } from "./utils/logger";
import type { Configuration } from "./types";

class EasyAmmunition implements IPostDBLoadModAsync
{
    public async postDBLoadAsync(container: DependencyContainer): Promise<void>
    {
        const logger = getLogger(container);
        let config: Configuration;

        try
        {
            config = await loadConfiguration("../../config/config.json5");
            validateConfiguration(config);
        }
        catch (error: any)
        {
            logger.log(`EasyAmmunition: Error loading configuration. ${error.message} No changes made.`, "red");
            return;
        }

        if (!config.enabled) {
            logger.log("EasyAmmunition is disabled in the config file.", "red");
            return;
        }

        adjustAmmunition(container, config);
    }
}

module.exports = { mod: new EasyAmmunition() };
