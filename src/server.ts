import { Server } from 'socket.io';
import expressApp from './express';
import logger from './libs/pino';
import { DOMAIN_NAME, PORT } from './constants';
import { handleWallJoin } from './sockets/openingSockets';

const httpServer = expressApp.listen(PORT, () => {
    logger.info(`Express server is running on http://localhost:${PORT}`);
});

const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? DOMAIN_NAME
            : "http://localhost:5173",
    },
});

io.on('connection', (socket) => {
    socket.on('wall:join', (wallId: string) => {
        handleWallJoin(socket, wallId);
    });

    socket.on('disconnect', () => {
    });
});