import type { IPostDBLoadModAsync } from '@spt-aki/models/external/IPostDBLoadModAsync';
import { join } from 'path';
import { DependencyContainer } from 'tsyringe';
import { adjustAmmunition } from './ammunition';
import { loadConfiguration, validateConfiguration } from './config';
import type { Configuration } from './types';
import { getLogger } from './utils/logger';

class EasyAmmunition implements IPostDBLoadModAsync {
    public async postDBLoadAsync(
        container: DependencyContainer
    ): Promise<void> {
        const logger = getLogger(container);

        const configPath = join(__dirname, '../config/config.json5');
        let config: Configuration;

        try {
            config = await loadConfiguration(configPath);
            validateConfiguration(config);
        } catch (error: any) {
            logger.log(
                `EasyAmmunition: Error loading configuration. ${error.message} No changes made.`,
                'red'
            );
            return;
        }

        if (!config.enabled) {
            logger.log('EasyAmmunition is disabled in the config file.', 'red');
            return;
        }

        adjustAmmunition(container, config);
    }
}

module.exports = { mod: new EasyAmmunition() };
