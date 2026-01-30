import { Opening, OpeningShape } from "./types";

export const DOMAIN_NAME: string = "https://akivabuckman.com";
export const PORT: number = Number(process.env.PORT) || 5000;
export const defaultOpenings: Opening[] = [
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