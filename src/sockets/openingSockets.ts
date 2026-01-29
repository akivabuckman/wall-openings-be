
import { Socket } from 'socket.io';
import logger from '../libs/pino';
import { getWallById } from '../models/openingModel';
import { addDefaultOpenings } from '../services/openingServices';

export const handleWallJoin = async (socket: Socket, wallId: string) => {
	logger.info(`Handling wall join for socket ${socket.id} and wall ${wallId}`);
    const existingWall = await getWallById(wallId);
    if (!existingWall) {
        await addDefaultOpenings(wallId);
        logger.info(`Created default openings for wall ${wallId}`);
    }
};
