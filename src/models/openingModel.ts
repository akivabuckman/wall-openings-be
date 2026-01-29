import { prisma } from "../libs/prisma";
import { OpeningWithWallId } from "../types";

export const addOpening = async (opening: OpeningWithWallId) => {
    const { wallId, ...openingData } = opening;
    
    await prisma.opening.create({
        data: {
            ...openingData,
            wall: {
                connectOrCreate: {
                    where: { id: wallId },
                    create: { id: wallId, name: `Wall ${wallId}` },
                },
            },
        },
    });
};

export const getWallById = async (wallId: string) => {
    const wall = await prisma.wall.findUnique({
        where: { id: wallId },
    });
    return wall;
};
