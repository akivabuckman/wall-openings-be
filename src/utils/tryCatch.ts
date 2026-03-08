import { Socket } from "socket.io";
import logger from "../libs/pino";
import { emitToSocket } from "../socket/sockets";

export function tryCatchSocket<T extends (...args: any[]) => Promise<any>>(
	fn: T
): (...args: Parameters<T>) => Promise<void> {
	return async (...args: Parameters<T>) => {
		const socket: Socket = args[0];
		try {
			await fn(...args);
		} catch (err: any) {
			logger.error(err);
            emitToSocket(socket, "error", { type: "error", payload: { message: "Internal server error", details: err?.message || String(err) } });
		}
	};
}
