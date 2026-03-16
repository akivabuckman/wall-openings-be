import { OpeningShape } from "./types";

export const DOMAIN_NAME: string = "https://akivabuckman.com";
export const PORT: number = Number(process.env.PORT) || 5000;
export const defaultOpenings = [
    {
        shape: OpeningShape.RECTANGLE,
        width: 100,
        height: 200,
        x: 220,
        elevation: 0,
        color: "red",
        fromPrevious: 110,
    },
    {
        shape: OpeningShape.CIRCLE,
        radius: 15,
        x: 110,
        elevation: 320,
        color: "blue",
        fromPrevious: 0,
    },
    {
        shape: OpeningShape.RECTANGLE,
        width: 100,
        height: 60,
        x: 300,
        elevation: 250,
        color: "green",
        fromPrevious: 80,
    }
];

export const WINDOW_MS = 60 * 60 * 1000;
export const MAX_REQUESTS = 10;
export const defaultWallExpirationDays = 7;
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const STREAM_MAX_LEN = 500;       // max events retained per wall
export const STREAM_TTL_SECONDS = 3600;  // stream expires after 1 hour of inactivity
export const UNDO_STACK_MAX = 20;
