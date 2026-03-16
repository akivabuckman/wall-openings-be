import Redis from "ioredis";
import logger from "./pino";
import { REDIS_URL } from "../constants";

const redisOptions = {
    retryStrategy: () => null,       // disable reconnection retries
    enableOfflineQueue: false,       // fail commands immediately when disconnected
    lazyConnect: true,               // don't connect until first command
    maxRetriesPerRequest: 0,
    tls: process.env.NODE_ENV === "production" ? {} : undefined,
};

export let isRedisAvailable = false;

export const redisClient = new Redis(REDIS_URL, redisOptions);
export const redisSubscriber = new Redis(REDIS_URL, redisOptions);
const errorMessage = "Redis unavailable — stream and undo features disabled";
redisClient.on("connect", () => {
    isRedisAvailable = true;
    logger.info("Redis client connected");
});
redisClient.on("close", () => {
    isRedisAvailable = false;
    logger.warn(errorMessage);
});
redisClient.on("error", (err) => {
    isRedisAvailable = false;
    logger.warn({ err }, errorMessage);
});

redisClient.connect().catch(() => {
    logger.warn(errorMessage);
});
