import { MAX_REQUESTS, WINDOW_MS } from "../constants";
import { RateLimitEntry } from "../types";

const store = new Map<string, RateLimitEntry>();

export function checkWallJoinRateLimit(ip: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
        store.set(ip, { count: 1, windowStart: now });
        return { allowed: true };
    }

    if (entry.count >= MAX_REQUESTS) {
        return {
            allowed: false,
            message: 'Too many wall join requests from this IP, please try again later.',
        };
    }

    entry.count++;
    return { allowed: true };
}
