import { prisma } from "../../lib/prisma.js";
import { genreSelect } from "./genreTypes.js";

export const listGenres = () => {
  return prisma.genre.findMany({
    select: genreSelect,
    orderBy: { name: "asc" },
  });
};
