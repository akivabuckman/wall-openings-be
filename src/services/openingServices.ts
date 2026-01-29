import { defaultOpenings } from "../constants"
import { addOpening } from "../models/openingModel";
import { OpeningWithWallId } from "../types";

export const addDefaultOpenings = async (wallId: string) => {
    defaultOpenings.forEach(async (opening) => {
        const openingWithWallId: OpeningWithWallId = { ...opening, wallId };
        await addOpening(openingWithWallId);
    });
}