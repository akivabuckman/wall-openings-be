-- DropForeignKey
ALTER TABLE "Opening" DROP CONSTRAINT "Opening_wallId_fkey";

-- AddForeignKey
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_wallId_fkey" FOREIGN KEY ("wallId") REFERENCES "Wall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
