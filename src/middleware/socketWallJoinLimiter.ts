import { DefaultEventsMap, Socket } from 'socket.io';
import { checkWallJoinRateLimit } from './wallJoinLimiter';

export function socketWallJoinRateLimiter(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, next: (err?: any) => void) {
    const ip = socket.handshake.address;
    const result = checkWallJoinRateLimit(ip);

    if (!result.allowed) {
        next(new Error(result.message));
    } else {
        next();
    }
}
