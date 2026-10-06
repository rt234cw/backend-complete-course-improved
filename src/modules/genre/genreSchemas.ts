import { z } from "zod";

export const genreSchema = z
  .strictObject({
    id: z.uuid(),
    name: z.string().meta({ example: "Sci-Fi" }),
  })
  .meta({ id: "Genre" });
