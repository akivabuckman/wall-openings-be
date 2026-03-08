import { Server } from 'socket.io';
import expressApp from './express';
import logger from './libs/pino';
import { DOMAIN_NAME, PORT } from './constants';
import { handleOpeningChange, handleWallJoin, handleOpeningDelete, handleNewOpeningRequest } from './controllers/openingControllers';
import { Opening } from './types';
import { socketWallJoinRateLimiter } from './middleware/socketWallJoinLimiter';
import { emitToSocket } from './socket/sockets';

const httpServer = expressApp.listen(PORT, () => {
    logger.info(`Express server is running on port ${PORT}`);
});


export const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? DOMAIN_NAME
            : "http://localhost:5173",
    },
});

io.on('connection', (socket) => {
    socket.onAny((event, source, ...args) => {
        if (source === "server") return;
        logger.info({ event, args, socketId: socket.id }, `Socket event received`);
    });

    socket.on('wallJoin', ({wallId}: {wallId: string | null, source: string}) => {
        if (!wallId || wallId === "") {
            socketWallJoinRateLimiter(socket, async (err) => {
                if (err) {
                    logger.error(`Rate limit exceeded for socket ${socket.id} on wallJoin: ${err.message}`);
                    return emitToSocket(socket, "error", { type: "error", payload: { message: err.message } });
                }
                await handleWallJoin(socket, wallId);
            });
        } else {
            handleWallJoin(socket, wallId);
        }
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

    socket.on('disconnect', () => {
    });
});
