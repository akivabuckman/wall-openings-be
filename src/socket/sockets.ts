import { Socket } from "socket.io";
import logger from "../libs/pino";
import { SocketResponse } from "../types";
import { io } from "../server";

export const joinWall = (socket: Socket, wallId: string) => {
    socket.join(wallId);
    emitToSocket(socket, "joinedWall", { type: "success", source: "server", payload: { wallId } });
    logger.info(`Socket ${socket.id} joined room ${wallId}`);
};

export const emitToSocket = (socket: Socket, event: string, response: SocketResponse) => {
    response.source = "server";
    socket.emit(event, response);
    logger.info(`Emitted event '${event}' to socket ${socket.id} with response: ${JSON.stringify(response)}`);
};

export const emitToRoom = (wallId: string, event: string, response: SocketResponse) => {
    response.source = "server";
    io.to(wallId).emit(event, response);
    logger.info(`Emitted event '${event}' to room ${wallId} with response: ${JSON.stringify(response)}`);
};
