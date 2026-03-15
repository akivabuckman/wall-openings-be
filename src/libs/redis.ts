import Redis from "ioredis";
import logger from "./pino";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = new Redis(REDIS_URL);
export const redisSubscriber = new Redis(REDIS_URL); // separate connection required by Socket.IO adapter

redisClient.on("connect", () => logger.info("Redis client connected"));
redisClient.on("error", (err) => logger.error({ err }, "Redis client error"));
