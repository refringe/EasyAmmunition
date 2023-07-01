import { Configuration, BackgroundColor, validBackgroundColors } from "./../types";

export function validateConfiguration(config: any): string | null
{
    if (!config || typeof config !== "object")
    {
        return "Configuration is not an object.";
    }

    if (!Array.isArray(config.penetration) || config.penetration.length === 0)
    {
        return "Configuration validation error: 'penetration' property should be a non-empty array.";
    }

    let prevMinPenetration = Infinity;
    for (const penetrationConfig of config.penetration)
    {
        if (typeof penetrationConfig.minPenetration !== "number" || penetrationConfig.minPenetration < 0)
        {
            return "Configuration validation error: 'minPenetration' must be a number greater than or equal to 0.";
        }

        if (penetrationConfig.minPenetration > prevMinPenetration)
        {
            return "Configuration validation error: 'penetration' array should be sorted in descending order based on 'minPenetration'.";
        }
        prevMinPenetration = penetrationConfig.minPenetration;

        if (!isValidBackgroundColor(penetrationConfig.backgroundColor))
        {
            return `Configuration validation error: '${penetrationConfig.backgroundColor}' is not a valid background color.`;
        }
    }

    return null; // No errors
}

function isValidBackgroundColor(color: string): color is BackgroundColor
{
    return validBackgroundColors.includes(color as BackgroundColor);
}
