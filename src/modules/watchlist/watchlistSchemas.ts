import { z } from "zod";
import { WatchlistStatus } from "@prisma/client";
import { paginationQuerySchema } from "../../schemas/commonSchemas.js";
import { movieSchema } from "../movie/movieSchemas.js";

const addToWatchlistSchema = z
  .object({
    movieId: z.uuid(),
    status: z
      .enum(WatchlistStatus, {
        error: () => ({
          message: `status must be one of:${Object.values(WatchlistStatus).join(", ")}`,
        }),
      })
      .optional(),
    rating: z.coerce
      .number()
      .int("Rating must be an integer")
      .min(1)
      .max(10)
      .optional()
      .meta({ example: 8 }),

    notes: z.string().optional().meta({ example: "Rewatch with friends" }),
  })
  .meta({ id: "AddToWatchlistRequest" });

// omit 是 zod的方法，要剔除的field標記true，保留的不寫或是寫false
const patchWatchlistItemSchema = addToWatchlistSchema
  .omit({ movieId: true })

  // refine() 用來加自訂的驗證規則
  // 不加的話，body是空的，也會執行成功
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (status, rating, notes) must be provided",
  })
  .meta({ id: "UpdateWatchlistItemRequest", description: "At least one field is required" });

/**
 * data : 是Zod驗證完欄位後得到的物件
 * 例如：api 傳送的body是 {"rating":8, "notes":"good"}
 * 這個data 就算等於這個body object
 *
 * Object.keys(data)，取這個物件所有的key值。註：在safeParse的步驟中，只解析有列出來的key name，所以塞入其他key時會被排除
 * 以此例來說，這裡得到的length就是2
 */

const listWatchlistQuerySchema = paginationQuerySchema.extend({
  status: z.enum(WatchlistStatus).optional(),
});

const watchlistItemSchema = z
  .strictObject({
    id: z.uuid(),
    userId: z.uuid(),
    movieId: z.uuid(),
    status: z.enum(WatchlistStatus),
    rating: z.number().int().nullable().meta({ example: 8 }),
    notes: z.string().nullable().meta({ example: "Rewatch with friends" }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "WatchlistItem" });

const watchlistItemWithMovieSchema = watchlistItemSchema
  .extend({ movie: movieSchema })
  .meta({ id: "WatchlistItemWithMovie" });

const watchlistIdSchema = watchlistItemSchema
  .pick({ id: true, movieId: true, status: true })
  .meta({ id: "WatchlistId" });

type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;
type PatchWatchlistItemInput = z.infer<typeof patchWatchlistItemSchema>;
type ListWatchlistQuery = z.infer<typeof listWatchlistQuerySchema>;

export {
  addToWatchlistSchema,
  listWatchlistQuerySchema,
  patchWatchlistItemSchema,
  watchlistIdSchema,
  watchlistItemSchema,
  watchlistItemWithMovieSchema,
};
export type { AddToWatchlistInput, ListWatchlistQuery, PatchWatchlistItemInput };
