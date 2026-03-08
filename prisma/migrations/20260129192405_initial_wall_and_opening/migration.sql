-- CreateEnum
CREATE TYPE "OpeningShape" AS ENUM ('RECTANGLE', 'CIRCLE');

-- CreateTable
CREATE TABLE "Opening" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "radius" INTEGER,
    "x" INTEGER NOT NULL,
    "elevation" INTEGER NOT NULL,
    "color" TEXT,
    "shape" "OpeningShape" NOT NULL,
    "fromPrevious" INTEGER NOT NULL,
    "wallId" TEXT,

    CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wall" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_wallId_fkey" FOREIGN KEY ("wallId") REFERENCES "Wall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
