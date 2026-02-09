import { Socket } from "socket.io";
import logger from "../libs/pino";
import { getWallById, patchOpening } from "../models/openingModel";
import { handleDefaults } from "../services/openingServices";
import { tryCatchSocket } from "../utils/tryCatch";
import { Opening, SocketResponse } from "../types";
import { emitToRoom, emitToSocket, joinWall } from "../socket/sockets";

export const handleWallJoin = tryCatchSocket(async (socket: Socket, wallId: string | null) => {
    logger.info(`Handling wall join for socket ${socket.id} and wall ${wallId}`);
    if (!wallId || wallId === "") {
        return await handleDefaults(socket);
    }
    const existingWall = await getWallById(wallId);
    if (!existingWall) {
        const response: SocketResponse = {
            type: "error",
            payload: `Wall with id ${wallId} does not exist.`,
        };
        return emitToSocket(socket, "error", response);
    }
    joinWall(socket, wallId);
    logger.info(`Socket ${socket.id} joined room ${wallId}`);
    const openings = existingWall.openings || [];
    logger.info(`Emitting ${openings.length} existing openings to socket ${socket.id} for wall ${wallId}: ${JSON.stringify(openings)}`);
    const response: SocketResponse = {
        type: "success",
        payload: {
            wallId,
            openings,
        },
    };
    return emitToRoom(wallId, "initialOpenings", response);
});

export const handleOpeningChange = tryCatchSocket(async (socket: Socket, opening: Opening) => {
    console.log(99999, opening)
    logger.info(`Handling opening change for socket ${socket.id} and wall ${opening.wallId}: ${JSON.stringify(opening)}`);
    await patchOpening(opening.id, opening);
    const response: SocketResponse = {
        type: "success",
        payload: opening,
    };
    joinWall(socket, opening.wallId);
    return emitToRoom(opening.wallId, "dbUpdated", response);
});
