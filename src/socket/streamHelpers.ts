import { nanoid } from "nanoid";
import { isRedisAvailable, redisClient } from "../libs/redis";
import logger from "../libs/pino";
import { SocketResponse } from "../types";
import { STREAM_MAX_LEN, STREAM_TTL_SECONDS, UNDO_STACK_MAX } from "../constants";

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
    if (!isRedisAvailable) return "0-0";
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

const undoKey = (wallId: string) => `undo:wall:${wallId}`;

export type UndoEntry =
    | { type: "update"; openingId: string; before: Record<string, unknown> }
    | { type: "create"; openingId: string; wallId: string }
    | { type: "delete"; openingId: string; before: Record<string, unknown> };

/**
 * Pushes an undo entry onto the wall's undo stack (capped at UNDO_STACK_MAX).
 */
export const pushUndoStack = async (wallId: string, entry: UndoEntry): Promise<void> => {
    if (!isRedisAvailable) return;
    const key = undoKey(wallId);
    await redisClient.rpush(key, JSON.stringify(entry));
    await redisClient.ltrim(key, -UNDO_STACK_MAX, -1);
    await redisClient.expire(key, STREAM_TTL_SECONDS);
    logger.info(`Pushed undo entry for opening ${entry.openingId} on wall ${wallId}`);
};

/**
 * Pops the most recent undo entry from the wall's undo stack.
 * Returns null if the stack is empty.
 */
export const popUndoStack = async (wallId: string): Promise<UndoEntry | null> => {
    if (!isRedisAvailable) return null;
    const key = undoKey(wallId);
    const raw = await redisClient.rpop(key);
    if (!raw) return null;
    return JSON.parse(raw) as UndoEntry;
};

/**
 * Returns the latest entry ID in the wall's stream, or "0-0" if the stream is empty.
 */
export const getLastEntryId = async (wallId: string): Promise<string> => {
    if (!isRedisAvailable) return "0-0";
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
    if (!isRedisAvailable) return [];
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
