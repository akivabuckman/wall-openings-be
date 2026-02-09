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

export const patchOpening = async (openingId: string, updates: Partial<Omit<OpeningWithOnlyWallId, 'wallId'>>) => {
    logger.info(`Patching opening ${openingId} with updates: ${JSON.stringify(updates)}...`);
    const updatedOpening = await prisma.opening.update({
        where: { id: openingId },
        data: updates,
    });
    logger.info(`Patched opening ${openingId}`);
    return updatedOpening;
};
