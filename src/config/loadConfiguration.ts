import { promises as fs } from 'fs';
import * as json5 from 'json5';
import type { Configuration } from './../types';
import { validateConfiguration } from './validateConfiguration';

export async function loadConfiguration(
    configFilePath: string
): Promise<Configuration> {
    // Load the configuration file
    const configFileContent = await fs.readFile(configFilePath, 'utf-8');
    const config = json5.parse(configFileContent);

    // Validate the configuration and throw an error if invalid.
    const validationError = validateConfiguration(config);
    if (validationError) {
        throw new Error(validationError);
    }

    return config as Configuration;
}
