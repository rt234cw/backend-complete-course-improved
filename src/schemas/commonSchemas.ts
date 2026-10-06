import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export type IdParams = z.infer<typeof idParamSchema>;

export const MAX_PAGE = 10_000;
export const MAX_PAGE_LIMIT = 50;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
