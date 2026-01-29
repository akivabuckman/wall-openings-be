export enum OpeningShape {
    RECTANGLE = 'RECTANGLE',
    CIRCLE = 'CIRCLE'
}

interface OpeningBase {
  x: number;
  elevation: number;
  color: string;
  id?: string;
  fromPrevious: number;
  xIndex?: number;
  wallId?: string;
}

export interface RectangleOpening extends OpeningBase {
  shape: OpeningShape.RECTANGLE;
  width: number;
  height: number;
}

export interface CircleOpening extends OpeningBase {
  shape: OpeningShape.CIRCLE;
  radius: number;
}

export type Opening = RectangleOpening | CircleOpening;

export type OpeningWithWallId = Opening & { wallId: string };