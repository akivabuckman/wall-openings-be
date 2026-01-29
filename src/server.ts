import { Server } from 'socket.io';
import expressApp from './express';
import logger from './libs/pino';
import { DOMAIN_NAME } from './constants';

const PORT = 5000;

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
    logger.info(`Socket connected: ${socket.id}`);

    // Add your event handlers here

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});