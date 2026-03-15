import { Socket } from "socket.io";
import { defaultOpenings } from "../constants"
import logger from "../libs/pino";
import { addOpening, addWall, getOpeningById } from "../models/openingModel";
import { OpeningWithOnlyWallId, SocketResponse } from "../types";
import { customAlphabet } from "nanoid";
import { emitToSocket, joinWall } from "../socket/sockets";
import { getLastEntryId } from "../socket/streamHelpers";

const addDefaultOpenings = async (wallId: string) => {
    logger.info(`Adding wall and default openings to wall ${wallId}...`);
    const createdOpenings = await Promise.all(
        defaultOpenings.map(async (opening) => {
            const openingWithWallId: OpeningWithOnlyWallId = { ...opening, wallId };
            const openingId = await addOpening(openingWithWallId);
            return {
                ...opening,
                wallId,
                id: openingId,
            };
        })
    );
    logger.info(`Added default openings to wall ${wallId}`);
    return createdOpenings;
};

export const handleDefaults = async (socket: Socket) => {
    const wallId = await addWall();
    const addedOpenings = await addDefaultOpenings(wallId);
    const lastEntryId = await getLastEntryId(wallId);
    const response: SocketResponse = {
        type: "success",
        payload: {
            wallId,
            openings: addedOpenings,
        },
        source: "server",
        _meta: { lastEntryId },
    }
    joinWall(socket, wallId);
    return emitToSocket(socket, "initialOpenings", response);
};

export const generateWallId = () => {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
    const wallId = nanoid(8);
    return wallId;
};

export const getPreviousOpeningState = async (openingId: string, socket: Socket) => {
    const before = await getOpeningById(openingId);
        if (!before) {
            return emitToSocket(socket, "error", {
                type: "error",
                payload: { message: `Opening with id ${openingId} does not exist.` },
            });
        }
    return before;
};
