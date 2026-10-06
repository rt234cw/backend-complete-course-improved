-- DropForeignKey
ALTER TABLE "Movie" DROP CONSTRAINT "Movie_createdBy_fkey";

-- RenameColumn
ALTER TABLE "Movie" RENAME COLUMN "postUrl" TO "posterUrl";

-- AlterTable
ALTER TABLE "Movie" ALTER COLUMN "createdBy" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Movie_createdBy_idx" ON "Movie"("createdBy");

-- CreateIndex
CREATE INDEX "Movie_releaseYear_idx" ON "Movie"("releaseYear");

-- CreateIndex
CREATE INDEX "Movie_createdAt_idx" ON "Movie"("createdAt");

-- CreateIndex
CREATE INDEX "MovieGenre_genreId_idx" ON "MovieGenre"("genreId");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_status_idx" ON "WatchlistItem"("userId", "status");

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
