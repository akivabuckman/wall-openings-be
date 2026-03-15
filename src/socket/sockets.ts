import { Socket } from "socket.io";
import logger from "../libs/pino";
import { SocketResponse } from "../types";
import { io } from "../server";
import { appendToStream } from "./streamHelpers";

export const joinWall = async (socket: Socket, wallId: string) => {
    await socket.join(wallId);
    emitToSocket(socket, "joinedWall", { type: "success", source: "server", payload: { wallId } });
    logger.info(`Socket ${socket.id} joined room ${wallId}`);
};

export const emitToSocket = async (socket: Socket, event: string, response: SocketResponse) => {
    response.source = "server";
    socket.emit(event, response);
    logger.info(`Emitted event '${event}' to socket ${socket.id} with response: ${JSON.stringify(response)}`);
};

export const emitToRoom = async (wallId: string, event: string, response: SocketResponse): Promise<string> => {
    const lastEntryId = await appendToStream(wallId, event, response);
    response.source = "server";
    response._meta = { lastEntryId };
    io.to(wallId).emit(event, response);
    logger.info(`Emitted event '${event}' to room ${wallId} with lastEntryId: ${lastEntryId}`);
    return lastEntryId;
};
