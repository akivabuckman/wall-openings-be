import { Server } from 'socket.io';
import expressApp from './express';
import logger from './libs/pino';
import { DOMAIN_NAME, PORT } from './constants';
import { handleOpeningChange, handleWallJoin, handleOpeningDelete, handleNewOpeningRequest, handleReconnect, handleUndo } from './controllers/openingControllers';
import { Opening } from './types';
import { socketWallJoinRateLimiter } from './middleware/socketWallJoinLimiter';
import { emitToSocket } from './socket/sockets';
import { isRedisAvailable } from './libs/redis';

const httpServer = expressApp.listen(PORT, () => {
    logger.info(`Express server is running on port ${PORT}`);
});


export const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? DOMAIN_NAME
            : "http://localhost:5173",
    },
    path: "/wall-openings/socket",
});

io.on('connection', (socket) => {
    socket.onAny((event, source, ...args) => {
        if (source === "server") return;
        logger.info({ event, args, socketId: socket.id }, `Socket event received`);
    });

    socket.on('wallJoin', async ({wallId}: {wallId: string | null, source: string}) => {
        if (!wallId || wallId === "") {
            socketWallJoinRateLimiter(socket, async (err) => {
                if (err) {
                    logger.error(`Rate limit exceeded for socket ${socket.id} on wallJoin: ${err.message}`);
                    return emitToSocket(socket, "error", { type: "error", payload: { message: err.message } });
                }
                await handleWallJoin(socket, wallId);
            });
        } else {
            await handleWallJoin(socket, wallId)
        }
        if (!isRedisAvailable) emitToSocket(socket, "redisError", { type: "error", source: "server", payload: { message: "Redis unavailable - undo features disabled" } });
    });

    socket.on('openingChange', (data: {opening: Opening, source: string}) => {
        handleOpeningChange(socket, data.opening);
    });

    socket.on('deleteOpening', (data: { wallId: string, openingId: string, source: string }) => {
        handleOpeningDelete(socket, data.wallId, data.openingId);
    });

    socket.on('requestNewOpening', (data: { wallId: string, source: string }) => {
        handleNewOpeningRequest(socket, data.wallId);
    });

    socket.on('requestReconnect', (data: { wallId: string; lastEntryId: string; source: string }) => {
        handleReconnect(socket, data.wallId, data.lastEntryId);
    });

    socket.on('requestUndo', (data: { wallId: string; source: string }) => {
        handleUndo(socket, data.wallId);
    });

    socket.on('disconnect', () => {
    });
});
