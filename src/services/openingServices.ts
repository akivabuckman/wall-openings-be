import { defaultOpenings } from "../constants"
import logger from "../libs/pino";
import { addOpening, addWall } from "../models/openingModel";
import { OpeningWithWallId } from "../types";

export const addDefaultOpenings = async (wallId: string) => {
    logger.info(`Adding wall and default openings to wall ${wallId}...`);
    await addWall(wallId);
    await Promise.all(
        defaultOpenings.map((opening) => {
            const openingWithWallId: OpeningWithWallId = { ...opening, wallId };
            return addOpening(openingWithWallId);
        })
    );
    logger.info(`Added default openings to wall ${wallId}`);
    return defaultOpenings;
};
