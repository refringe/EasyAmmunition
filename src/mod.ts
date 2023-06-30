import type { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import type { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { DependencyContainer } from "tsyringe";

const validBackgroundColors = [
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
    "yellow"
] as const;

type BackgroundColor = typeof validBackgroundColors[number];

type PenetrationConfig = {
    minPenetration: number,
    backgroundColor: BackgroundColor
};

type Configuration = {
    enabled: boolean,
    debug: boolean,
    penetration: PenetrationConfig[]
};

const AMMO_PARENT_NAME = "Ammo";
const BULLET_TYPE = "bullet";
const BUCKSHOT_TYPE = "buckshot";

class EasyAmmunition implements IPostDBLoadMod
{
    private config: Configuration;
    private container: DependencyContainer;
    private logger: ILogger;
    private debug = false;

    public postDBLoad(container: DependencyContainer): void
    {
        this.container = container;
        this.logger = this.container.resolve<ILogger>("WinstonLogger");

        try
        {
            this.loadConfiguration();
        }
        catch (error)
        {
            this.logger.log("EasyAmmunition: Error loading configuration. " + error.message + " No changes made.", "red");
            return;
        }

        if (!this.config.enabled)
        {
            this.logger.log("EasyAmmunition is disabled in the config file.", "red");
            return;
        }

        this.debug = this.config.debug;

        // Engage!
        this.adjustAmmunition();
    }

    /**
     * Loads the configuration file.
     */
    private loadConfiguration(): void
    {
        require("json5/lib/register");
        this.config = require("../config/config.json5");
        
        // Validate the configuration and throw an error if invalid.
        const validationError = this.validateConfiguration(this.config);
        if (validationError)
            throw new Error(validationError);
    }

    /**
     * Validates the structure of the configuration object.
     */
    private validateConfiguration(config: any): string | null
    {
        if (!config || typeof config !== "object")
            return "Configuration is not an object.";
    
        if (!Array.isArray(config.penetration) || config.penetration.length === 0)
            return "Configuration validation error: 'penetration' property should be a non-empty array.";
    
        let prevMinPenetration = Infinity;
        for (const penetrationConfig of config.penetration)
        {
            if (typeof penetrationConfig.minPenetration !== "number" || penetrationConfig.minPenetration < 0)
                return "Configuration validation error: 'minPenetration' must be a number greater than or equal to 0.";

            if (penetrationConfig.minPenetration > prevMinPenetration)
                return "Configuration validation error: 'penetration' array should be sorted in descending order based on 'minPenetration'.";
            prevMinPenetration = penetrationConfig.minPenetration;

            if (!this.isValidBackgroundColor(penetrationConfig.backgroundColor))
                return `Configuration validation error: '${penetrationConfig.backgroundColor}' is not a valid background color.`;
        }
    
        return null; // No errors
    }

    /**
     * Checks if the given color is a valid background color.
     */
    private isValidBackgroundColor(color: string): color is BackgroundColor
    {
        return validBackgroundColors.includes(color as BackgroundColor);
    }

    /**
     * Adjusts the background colour of all ammunition in the database.
     */
    private adjustAmmunition(): void
    {
        const items: Record<string, ITemplateItem> = this.container.resolve<DatabaseServer>("DatabaseServer").getTables().templates.items;

        // Get the parent ammo ID.
        const parentAmmo = Object.values(items).find(item => item._name === AMMO_PARENT_NAME);
        if (!parentAmmo)
        {
            this.logger.log("EasyAmmunition: Parent ammo ID not found. Something has gone terribly wrong. No changes made.", "red");
            return;
        }

        if (this.debug)
            this.logger.log(`EasyAmmunition: Parent ammo ID found: ${parentAmmo._id}.`, "gray");

        // Keep a count of the number of changes we make.
        let changeCount = 0;

        for (const item of Object.values(items))
        {
            if (
                item._parent === parentAmmo._id &&
                item._props?.ammoType &&
                item._props?.PenetrationPower &&
                item._props?.BackgroundColor &&
                !item._name.startsWith("shrapnel") &&
                (
                    item._props.ammoType === BULLET_TYPE ||
                    item._props.ammoType === BUCKSHOT_TYPE
                )
            )
            {
                const penetration:number = item._props.PenetrationPower;
                item._props.BackgroundColor = this.resolveBackgroundColour(penetration, this.config.penetration);

                if (this.debug)
                    this.logger.log(`EasyAmmunition: Ammo ${item._name} has pen value of ${penetration}. Set background colour to ${item._props.BackgroundColor}.`, "gray");

                changeCount++;
            }
        }

        this.logger.log(`EasyAmmunition: Adjusted the background color of ${changeCount} types of ammunition.`, "cyan");
    }
    
    /**
     * Resolves the background color for the given penetration value based on the provided configuration.
     */
    private resolveBackgroundColour(penetration: number, configuration: PenetrationConfig[]): string
    {
        // Iterate through each penetration range in the configuration
        for (const config of configuration)
        {
            // Check if the given penetration value falls within this range
            if (penetration >= config.minPenetration)
                return config.backgroundColor;
        }

        return "black";
    }
}

module.exports = {mod: new EasyAmmunition()};
