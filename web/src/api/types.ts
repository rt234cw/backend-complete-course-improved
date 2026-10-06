import type { components } from "./schema";

type Schemas = components["schemas"];

export type User = Schemas["User"];
export type Movie = Schemas["Movie"];
export type Genre = Schemas["Genre"];
export type PaginationMeta = Schemas["PaginationMeta"];
export type WatchlistItemWithMovie = Schemas["WatchlistItemWithMovie"];
export type WatchlistId = Schemas["WatchlistId"];
export type WatchlistStatus = WatchlistId["status"];
export type SignupBody = Schemas["SignupRequest"];
export type LoginBody = Schemas["LoginRequest"];
export type UpdateWatchlistItemBody = Schemas["UpdateWatchlistItemRequest"];
