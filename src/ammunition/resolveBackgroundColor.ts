import { BackgroundColor, PenetrationConfig } from "./../types";

export function resolveBackgroundColor(penetration: number, configuration: PenetrationConfig[]): BackgroundColor
{
    // Iterate through each penetration range in the configuration
    for (const config of configuration)
    {
        // Check if the given penetration value falls within this range
        if (penetration >= config.minPenetration)
        {
            return config.backgroundColor;
        }
    }

    // If no match is found, return default color
    return "black";
}
