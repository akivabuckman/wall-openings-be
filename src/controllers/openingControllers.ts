import { Socket } from "socket.io";
import logger from "../libs/pino";
import { addNewOpeningToDb, deleteOpeningFromDb, deleteOldWalls, getWallById, patchOpening } from "../models/openingModel";
import { defaultWallExpirationDays } from "../constants";
import { Request, Response } from "express";
import { handleDefaults } from "../services/openingServices";
import { tryCatchSocket } from "../utils/tryCatch";
import { Opening, SocketResponse } from "../types";
import { emitToRoom, emitToSocket, joinWall } from "../socket/sockets";
import { getLastEntryId, replayStream } from "../socket/streamHelpers";

export const handleWallJoin = tryCatchSocket(async (socket: Socket, wallId: string | null) => {
    logger.info(`Handling wall join for socket ${socket.id} and wall ${wallId}`);
    if (!wallId || wallId === "") {
        await handleDefaults(socket);
        return;
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
    const lastEntryId = await getLastEntryId(wallId);
    logger.info(`Emitting ${openings.length} existing openings to socket ${socket.id} for wall ${wallId}: ${JSON.stringify(openings)}`);
    const response: SocketResponse = {
        type: "success",
        payload: {
            wallId,
            openings,
        },
        _meta: { lastEntryId },
    };
    emitToSocket(socket, "initialOpenings", response);
});

export const handleOpeningChange = tryCatchSocket(async (socket: Socket, opening: Opening) => {
    logger.info(`Handling opening change for socket ${socket.id} and wall ${opening.wallId}: ${JSON.stringify(opening)}`);
    await patchOpening(opening.id, opening);
    const response: SocketResponse = {
        type: "success",
        payload: opening,
    };
    await emitToRoom(opening.wallId, "openingUpdated", response);
});

export const handleOpeningDelete = tryCatchSocket(async (socket: Socket, wallId: string, openingId: string) => {
    logger.info(`Handling opening delete for socket ${socket.id}, wall ${wallId}, opening ${openingId}`);
    await deleteOpeningFromDb(openingId);
    const response: SocketResponse = {
        type: "success",
        payload: { openingId },
    };
    await emitToRoom(wallId, "openingDeleted", response);
});

export const handleNewOpeningRequest = tryCatchSocket(async (socket: Socket, wallId: string) => {
    logger.info(`Handling new opening request for socket ${socket.id} and wall ${wallId}`);
    const newOpening = await addNewOpeningToDb(wallId);
    const response: SocketResponse = {
        type: "success",
        payload: newOpening,
    };
    await emitToRoom(wallId, "newOpening", response);
});

/**
 * Client emits `reconnect` with { wallId, lastEntryId }.
 * Server re-joins the socket to the room and replays all stream events
 * that occurred after lastEntryId. Pass "0-0" for a full replay.
 * Each replayed event includes _meta.entryId and _meta.eventId so the
 * client can deduplicate events it may have already processed.
 */
export const handleReconnect = tryCatchSocket(async (socket: Socket, wallId: string, lastEntryId: string) => {
    logger.info(`Handling reconnect for socket ${socket.id}, wall ${wallId}, lastEntryId: ${lastEntryId}`);

    const wall = await getWallById(wallId);
    if (!wall) {
        return emitToSocket(socket, "error", {
            type: "error",
            payload: { message: `Wall with id ${wallId} does not exist.` },
        });
    }

    await joinWall(socket, wallId);

    const missed = await replayStream(wallId, lastEntryId);
    logger.info(`Replaying ${missed.length} missed events to socket ${socket.id} for wall ${wallId}`);

    for (const { entryId, eventId, event, response } of missed) {
        const replayResponse: SocketResponse = {
            ...response,
            _meta: { lastEntryId: entryId, eventId, replayed: true },
        };
        emitToSocket(socket, event, replayResponse);
    }

    const lastReplayedEntryId = missed.length > 0
        ? missed[missed.length - 1].entryId
        : lastEntryId;

    emitToSocket(socket, "replayComplete", {
        type: "info",
        payload: { wallId, replayedCount: missed.length, lastEntryId: lastReplayedEntryId },
    });
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
