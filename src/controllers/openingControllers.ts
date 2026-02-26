import { Socket } from "socket.io";
import logger from "../libs/pino";
import { addNewOpeningToDb, deleteOpeningFromDb, getWallById, patchOpening } from "../models/openingModel";
import { handleDefaults } from "../services/openingServices";
import { tryCatchSocket } from "../utils/tryCatch";
import { Opening, SocketResponse } from "../types";
import { emitToRoom, emitToSocket, joinWall } from "../socket/sockets";

export const handleWallJoin = tryCatchSocket(async (socket: Socket, wallId: string | null) => {
    logger.info(`Handling wall join for socket ${socket.id} and wall ${wallId}`);
    if (!wallId || wallId === "") {
        return await handleDefaults();
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
    logger.info(`Handling opening change for socket ${socket.id} and wall ${opening.wallId}: ${JSON.stringify(opening)}`);
    await patchOpening(opening.id, opening);
    const response: SocketResponse = {
        type: "success",
        payload: opening,
    };
    return emitToRoom(opening.wallId, "openingUpdated", response);
});

export const handleOpeningDelete = tryCatchSocket(async (socket: Socket, wallId: string, openingId: string) => {
    logger.info(`Handling opening delete for socket ${socket.id}, wall ${wallId}, opening ${openingId}`);
    await deleteOpeningFromDb(openingId);
    const response: SocketResponse = {
        type: "success",
        payload: { openingId },
    };
    return emitToRoom(wallId, "openingDeleted", response);
});

export const handleNewOpeningRequest = tryCatchSocket(async (socket: Socket, wallId: string) => {
    logger.info(`Handling new opening request for socket ${socket.id} and wall ${wallId}`);
    const newOpening = await addNewOpeningToDb(wallId);
    const response: SocketResponse = {
        type: "success",
        payload: newOpening,
    };
    return emitToRoom(wallId, "newOpening", response);
});