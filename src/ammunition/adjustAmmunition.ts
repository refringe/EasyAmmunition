import { DependencyContainer } from 'tsyringe';
import type { ITemplateItem } from '@spt-aki/models/eft/common/tables/ITemplateItem';
import type { DatabaseServer } from '@spt-aki/servers/DatabaseServer';
import type { Configuration, BackgroundColor } from './../types';
import { resolveBackgroundColor } from './resolveBackgroundColor';
import { getLogger } from './../utils/logger';

const AMMO_PARENT_NAME = 'Ammo';
const BULLET_TYPE = 'bullet';
const BUCKSHOT_TYPE = 'buckshot';

export function adjustAmmunition(
    container: DependencyContainer,
    config: Configuration
): void {
    const logger = getLogger(container);
    const debug = config.debug;
    const items: Record<string, ITemplateItem> = container
        .resolve<DatabaseServer>('DatabaseServer')
        .getTables().templates.items;

    // Get the ammunition item parent ID.
    const parentAmmo = Object.values(items).find(
        item => item._name === AMMO_PARENT_NAME
    );
    if (!parentAmmo) {
        logger.log(
            'EasyAmmunition: Parent ammo ID not found. Something has gone terribly wrong. No changes made.',
            'red'
        );
        return;
    }

    if (debug) {
        logger.log(
            `EasyAmmunition: Parent ammo ID found: ${parentAmmo._id}.`,
            'gray'
        );
    }

    let changeCount = 0;

    for (const item of Object.values(items)) {
        if (
            item._parent === parentAmmo._id &&
            item._props?.ammoType &&
            item._props?.PenetrationPower &&
            item._props?.BackgroundColor &&
            !item._name.startsWith('shrapnel') &&
            (item._props.ammoType === BULLET_TYPE ||
                item._props.ammoType === BUCKSHOT_TYPE)
        ) {
            const penetration: number = item._props.PenetrationPower;
            item._props.BackgroundColor = resolveBackgroundColor(
                penetration,
                config.penetration
            );

            if (debug) {
                logger.log(
                    `EasyAmmunition: Ammo ${item._name} has pen value of ${penetration}. Set background colour to ${item._props.BackgroundColor}.`,
                    'gray'
                );
            }

            changeCount++;
        }
    }

    logger.log(
        `EasyAmmunition: Adjusted the background color of ${changeCount} types of ammunition.`,
        'cyan'
    );
}
