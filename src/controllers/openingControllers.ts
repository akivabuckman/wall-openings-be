import { Socket } from "socket.io";
import logger from "../libs/pino";
import { getWallById } from "../models/openingModel";
import { addDefaultOpenings } from "../services/openingServices";
import { tryCatchSocket } from "../utils/tryCatch";
import { Opening } from "../types";

export const handleWallJoin = tryCatchSocket(async (socket: Socket, wallId: string) => {
    logger.info(`Handling wall join for socket ${socket.id} and wall ${wallId}`);
    const existingWall = await getWallById(wallId);
    if (!existingWall) {
        const defaultOpenings = await addDefaultOpenings(wallId);
        socket.join(wallId);
        logger.info(`Socket ${socket.id} joined wall ${wallId}`);
        logger.info(`Emitting default openings to socket ${socket.id} for new wall ${wallId}: ${JSON.stringify(defaultOpenings)}`);
        return socket.emit("initialOpenings", { openings: defaultOpenings });
    }
    socket.join(wallId);
    logger.info(`Socket ${socket.id} joined wall ${wallId}`);
    const openings = existingWall.openings || [];
    logger.info(`Emitting ${openings.length} existing openings to socket ${socket.id} for wall ${wallId}: ${JSON.stringify(openings)}`);
    return socket.emit("initialOpenings", { openings });
});
