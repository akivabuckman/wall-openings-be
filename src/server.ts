import { Server } from 'socket.io';
import expressApp from './express';
import logger from './libs/pino';
import { DOMAIN_NAME, PORT } from './constants';
import { handleOpeningChange, handleWallJoin, handleOpeningDelete, handleNewOpeningRequest } from './controllers/openingControllers';
import { Opening } from './types';

const httpServer = expressApp.listen(PORT, () => {
    logger.info(`Express server is running on http://localhost:${PORT}`);
});

export const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? DOMAIN_NAME
            : "http://localhost:5173",
    },
});

io.on('connection', (socket) => {
    socket.on('wallJoin', ({wallId}: {wallId: string | null, source: string}) => {
        handleWallJoin(socket, wallId);
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
