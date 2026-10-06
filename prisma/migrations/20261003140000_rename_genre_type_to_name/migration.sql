-- RenameColumn
ALTER TABLE "Genre" RENAME COLUMN "type" TO "name";

-- RenameIndex
ALTER INDEX "Genre_type_key" RENAME TO "Genre_name_key";
