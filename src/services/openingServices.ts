import { Socket } from "socket.io";
import { defaultOpenings } from "../constants"
import logger from "../libs/pino";
import { addOpening, addWall } from "../models/openingModel";
import { OpeningWithOnlyWallId, SocketResponse } from "../types";
import { customAlphabet } from "nanoid";
import { emitToSocket, joinWall } from "../socket/sockets";

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
    const response: SocketResponse = {
        type: "success",
        payload: {
            wallId,
            openings: addedOpenings,
        },
        source: "server",
    }
    // return emitToRoom(wallId, "initialOpenings", response);
    joinWall(socket, wallId);
    return emitToSocket(socket, "initialOpenings", response);
};

export const generateWallId = () => {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
    const wallId = nanoid(8);
    return wallId;
};
