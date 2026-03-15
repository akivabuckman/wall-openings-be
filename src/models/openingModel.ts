import { defaultOpenings } from "../constants";
import logger from "../libs/pino";
import { prisma } from "../libs/prisma";
import { generateWallId } from "../services/openingServices";
import { OpeningWithOnlyWallId } from "../types";

export const addOpening = async (opening: OpeningWithOnlyWallId) => {
    const { wallId, ...openingData } = opening;
    logger.info(`Adding ${opening.shape} opening to wall ${wallId}...`);
    const newOpening = await prisma.opening.create({
        data: {
            ...openingData,
            wall: { connect: { id: wallId } },
        },
    });
    logger.info(`Added opening ${newOpening.id} to wall ${wallId}`);
    return newOpening.id;
};

export const getWallById = async (wallId: string) => {
    const wall = await prisma.wall.findUnique({
        where: { id: wallId },
        include: { openings: true },
    });
    return wall;
};

export const addWall = async (name?: string) => {
    const wallId = generateWallId();
    logger.info(`Adding new wall${name ? ` with name ${name}` : ''}...`);
    const newWall = await prisma.wall.create({
        data: {
            id: wallId,
            name: name || null,
        },
    });
    logger.info(`Added new wall with id ${newWall.id}`);
    return newWall.id;
};

export const getOpeningById = async (openingId: string) => {
    return prisma.opening.findUnique({ where: { id: openingId } });
};

export const restoreOpening = async (opening: Record<string, unknown>) => {
    const { wallId, id, createdAt, updatedAt, ...data } = opening;
    logger.info(`Restoring opening ${id} to wall ${wallId}...`);
    const restored = await prisma.opening.create({
        data: {
            id: id as string,
            ...(data as any),
            wall: { connect: { id: wallId as string } },
        },
    });
    logger.info(`Restored opening ${restored.id} to wall ${wallId}`);
    return restored;
};

export const patchOpening = async (openingId: string, updates: Partial<Omit<OpeningWithOnlyWallId, 'wallId'>>) => {
    logger.info(`Patching opening ${openingId} with updates: ${JSON.stringify(updates)}...`);
    const updatedOpening = await prisma.opening.update({
        where: { id: openingId },
        data: updates,
    });
    logger.info(`Patched opening ${openingId}`);
    return updatedOpening;
};

export const deleteOpeningFromDb = async (openingId: string) => {
    logger.info(`Deleting opening ${openingId}...`);
    await prisma.opening.delete({
        where: { id: openingId },
    });
    logger.info(`Deleted opening ${openingId}`);
};

export const addNewOpeningToDb = async (wallId: string) => {
    logger.info(`Adding new opening to wall ${wallId}...`);
    const defaultOpening = defaultOpenings[0];
    const newOpening = await prisma.opening.create({
        data: {
            ...defaultOpening,
            wall: { connect: { id: wallId } },
        },
    });
    logger.info(`Added new opening to wall ${wallId}`);
    return newOpening;
}

export const deleteOldWalls = async (startDate: Date) => {
    logger.info(`Deleting walls updated before ${startDate.toISOString()}...`);
    const deletedWalls = await prisma.wall.deleteMany({
        where: {
            updatedAt: {
                lt: startDate,
            },
        },
    });
    logger.info(`Deleted ${deletedWalls.count} walls updated before ${startDate.toISOString()}`);
    return deletedWalls
};
