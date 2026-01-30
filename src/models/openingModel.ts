import logger from "../libs/pino";
import { prisma } from "../libs/prisma";
import { OpeningWithWallId } from "../types";

export const addOpening = async (opening: OpeningWithWallId) => {
    const { wallId, ...openingData } = opening;
    logger.info(`Adding ${opening.shape} opening to wall ${wallId}...`);
    const newOpening = await prisma.opening.create({
        data: {
            ...openingData,
            wall: { connect: { id: wallId } },
        },
    });
    logger.info(`Added opening ${newOpening.id} to wall ${wallId}`);
    return newOpening;
};

export const getWallById = async (wallId: string) => {
    const wall = await prisma.wall.findUnique({
        where: { id: wallId },
        include: { openings: true },
    });
    return wall;
};

export const addWall = async (wallId: string, name?: string) => {
    logger.info(`Adding new wall${name ? ` with name ${name}` : ''}...`);
    const newWall = await prisma.wall.create({
        data: {
            id: wallId,
            name: name || null,
        },
    });
    logger.info(`Added new wall with id ${newWall.id}`);
    return newWall;
};
