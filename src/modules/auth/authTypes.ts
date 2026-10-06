import type { Prisma, User } from "@prisma/client";

export const authUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

export type AuthUser = Pick<User, "id" | "name" | "email">;

/** What a verified access token proves: only the user id (the JWT `sub` claim). */
export type AuthenticatedUser = Pick<User, "id">;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
