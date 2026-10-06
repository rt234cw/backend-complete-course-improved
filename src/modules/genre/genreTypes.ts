import type { Prisma } from "@prisma/client";

export const genreSelect = {
  id: true,
  name: true,
} satisfies Prisma.GenreSelect;
