import type { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import type { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { DependencyContainer } from "tsyringe";

class EasyAmmunition implements IPostDBLoadMod
{
    private config:any;
    private container:DependencyContainer;
    private logger:ILogger;
    private debug = false;

    public postDBLoad(container: DependencyContainer):void
    {
        require("json5/lib/register");
        this.config = require("../config/config.json5");

        this.container = container;

        // Get the logger from the server container.
        this.logger = this.container.resolve<ILogger>("WinstonLogger");

        // Check to see if the mod is enabled.
        if (!this.config.enabled)
        {
            this.logger.log("EasyAmmunition is disabled in the config file.", "red");
            return;
        }

        // We loud?
        this.debug = this.config.debug;

        // Engage!
        this.adjustAmmunition();
    }

    /**
     * Generates custom raid times based on a number of configuration values.
     */
    private adjustAmmunition():void
    {
        // Get the database tables.
        const items:Record<string, ITemplateItem> = this.container.resolve<DatabaseServer>("DatabaseServer").getTables().templates.items;

        // Get the parent ammo ID.
        let parentAmmoId = "";
        for (const item in items)
        {
            if (items[item]._name === "Ammo")
            {
                parentAmmoId = items[item]._id;
                break;
            }
        }

        // Check to see if the parent ammo ID was found.
        if (!parentAmmoId.length)
        {
            this.logger.log("EasyAmmunition: Parent ammo ID not found. Something has gone terribly wrong. No changes made.", "red");
            return;
        }

        if (this.debug)
            this.logger.log(`EasyAmmunition: Parent ammo ID found: ${parentAmmoId}.`, "gray");

        // Keep a count of the number of changes we make.
        let changeCount = 0;

        for (const item in items)
        {
            // Is this item a child of the ammo parent?
            if (items[item]._parent === parentAmmoId)
            {
                // Does this item have all of the required properties to make a determination?
                if (
                    Object.prototype.hasOwnProperty.call(items[item]._props, "ammoType") &&
                    Object.prototype.hasOwnProperty.call(items[item]._props, "PenetrationPower") &&
                    Object.prototype.hasOwnProperty.call(items[item]._props, "BackgroundColor") &&
                    !items[item]._name.startsWith("shrapnel") && // Shrapnel is a special case that we should ignore.
                    (
                        // Ignore grenades as well.
                        items[item]._props.ammoType === "bullet" ||
                        items[item]._props.ammoType === "buckshot"
                    )
                )
                {
                    // As a general rule, we'll set the background colour based on the penetration value.
                    // Every 10 points of additional penetration will be a new colour, starting at 20 pen (class 2 armour).
                    const penetration:number = items[item]._props.PenetrationPower;
                    if (penetration > 60)
                        items[item]._props.BackgroundColor = "red";
                    else if (penetration > 50)
                        items[item]._props.BackgroundColor = "yellow";
                    else if (penetration > 40)
                        items[item]._props.BackgroundColor = "violet";
                    else if (penetration > 30)
                        items[item]._props.BackgroundColor = "blue";
                    else if (penetration > 20)
                        items[item]._props.BackgroundColor = "green";
                    else
                        items[item]._props.BackgroundColor = "grey";

                    if (this.debug)
                        this.logger.log(`EasyAmmunition: Ammo ${items[item]._name} has pen value of ${penetration}. Set background colour to ${items[item]._props.BackgroundColor}.`, "gray");

                    changeCount++;
                }
            }
        }

        this.logger.log(`EasyAmmunition: Adjusted the background color of ${changeCount} types of ammunition.`, "cyan");
    }
}

module.exports = {mod: new EasyAmmunition()};
