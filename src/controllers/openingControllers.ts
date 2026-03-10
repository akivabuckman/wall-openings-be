import { Socket } from "socket.io";
import logger from "../libs/pino";
import { addNewOpeningToDb, deleteOpeningFromDb, deleteOldWalls, getWallById, patchOpening } from "../models/openingModel";
import { defaultWallExpirationDays } from "../constants";
import { Request, Response } from "express";
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
            payload: { message: `Wall with id ${wallId} does not exist.` },
        };
        return emitToSocket(socket, "error", response);
    }
    await joinWall(socket, wallId);
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
    return emitToSocket(socket, "initialOpenings", response);
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

export const handleDeleteOld = async (req: Request, res: Response) => {
    const givenDaysBack = req.query.daysBack;
    if (givenDaysBack && isNaN(Number(givenDaysBack))) {
        return res.status(400).json({ message: `Invalid daysBack query parameter: '${givenDaysBack}'` });
    }
    const daysBackNumber = Number(givenDaysBack) || defaultWallExpirationDays;
    if (daysBackNumber < defaultWallExpirationDays) {
        return res.status(400).json({ message: `daysBack query parameter cannot be less than ${defaultWallExpirationDays}:, not '${givenDaysBack}'` });
    }
    const daysBackDate = new Date(Date.now() - daysBackNumber * 24 * 60 * 60 * 1000);
    const deletedWalls = await deleteOldWalls(daysBackDate);
    res.status(200).json({ 
        message: `Deleted ${deletedWalls.count} walls updated before ${daysBackDate.toISOString()}`,
        count: deletedWalls.count 
    });
};
