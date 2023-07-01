import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { DependencyContainer } from "tsyringe";

export function getLogger(container: DependencyContainer): ILogger {
    return container.resolve<ILogger>("WinstonLogger");
}
