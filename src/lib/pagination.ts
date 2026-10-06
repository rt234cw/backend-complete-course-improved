import type { PaginationQuery } from "../schemas/commonSchemas.js";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const toSkipTake = ({ page, limit }: PaginationQuery) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const toPaginationMeta = (
  { page, limit }: PaginationQuery,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
