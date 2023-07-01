import type { Configuration } from "./../types";
import { validateConfiguration } from "./validateConfiguration";

export async function loadConfiguration(configFilePath: string): Promise<Configuration>
{
    // Load the configuration file
    const config = await import(configFilePath);
    
    // Validate the configuration and throw an error if invalid.
    const validationError = validateConfiguration(config);
    if (validationError) {
        throw new Error(validationError);
    }
    
    return config as Configuration;
}
