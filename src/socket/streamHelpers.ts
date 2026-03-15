import { nanoid } from "nanoid";
import { redisClient } from "../libs/redis";
import logger from "../libs/pino";
import { SocketResponse } from "../types";

const STREAM_MAX_LEN = 500;       // max events retained per wall
const STREAM_TTL_SECONDS = 3600;  // stream expires after 1 hour of inactivity

const streamKey = (wallId: string) => `stream:wall:${wallId}`;

/**
 * Appends a broadcast event to the wall's Redis Stream.
 * Each entry carries a nanoid-based eventId for client-side deduplication.
 * Returns the Redis auto-generated entry ID (e.g. "1712345678901-0").
 */
export const appendToStream = async (
    wallId: string,
    event: string,
    response: SocketResponse
): Promise<string> => {
    const key = streamKey(wallId);
    const eventId = nanoid();

    const entryId = await redisClient.xadd(
        key,
        "MAXLEN", "~", String(STREAM_MAX_LEN),
        "*",
        "eventId", eventId,
        "event", event,
        "payload", JSON.stringify(response)
    );

    await redisClient.expire(key, STREAM_TTL_SECONDS);

    logger.info(`Appended event '${event}' to stream ${key} — entryId: ${entryId}, eventId: ${eventId}`);
    return entryId!;
};

/**
 * Returns the latest entry ID in the wall's stream, or "0-0" if the stream is empty.
 */
export const getLastEntryId = async (wallId: string): Promise<string> => {
    const key = streamKey(wallId);
    const entries = await redisClient.xrevrange(key, "+", "-", "COUNT", 1);
    return entries.length > 0 ? entries[0][0] : "0-0";
};

/**
 * Replays all events in the wall's stream that occurred after `lastEntryId`.
 * Pass "0-0" to replay the entire stream.
 * The event at `lastEntryId` itself is excluded.
 */
export const replayStream = async (
    wallId: string,
    lastEntryId: string
): Promise<{ entryId: string; eventId: string; event: string; response: SocketResponse }[]> => {
    const key = streamKey(wallId);

    const entries = await redisClient.xrange(key, lastEntryId, "+");

    const formattedEntries = entries
        .filter(([entryId]) => entryId !== lastEntryId)
        .map(([entryId, fields]) => {
            const fieldMap: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
                fieldMap[fields[i]] = fields[i + 1];
            }
            return {
                entryId,
                eventId: fieldMap.eventId,
                event: fieldMap.event,
                response: JSON.parse(fieldMap.payload) as SocketResponse,
            };
        });
    return formattedEntries;
};
