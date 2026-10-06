import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../errors/AppError.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { authUserSelect, type AuthTokens, type AuthUser } from "./authTypes.js";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "./token.js";

type Db = Prisma.TransactionClient;

const refreshTokenExpiresAt = () => new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);

const issueTokens = async (db: Db, userId: string, familyId: string): Promise<AuthTokens> => {
  const refreshToken = generateRefreshToken();

  await db.refreshToken.create({
    data: {
      userId,
      familyId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return { accessToken: signAccessToken(userId), refreshToken };
};

const revokeFamily = async (db: Db, familyId: string) => {
  await db.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const createSession = async (userId: string): Promise<AuthTokens> => {
  await prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  return issueTokens(prisma, userId, randomUUID());
};

export const refreshSession = async (
  rawRefreshToken: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(rawRefreshToken) },
    include: { user: { select: authUserSelect } },
  });

  if (!stored) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (stored.revokedAt) {
    await revokeFamily(prisma, stored.familyId);
    logger.warn(
      { userId: stored.userId, familyId: stored.familyId },
      "Refresh token reuse detected, whole token family revoked",
    );
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (stored.expiresAt <= new Date()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  const tokens = await prisma.$transaction(async (tx) => {
    const { count } = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      await revokeFamily(tx, stored.familyId);
      return null;
    }

    return issueTokens(tx, stored.userId, stored.familyId);
  });

  if (!tokens) {
    logger.warn(
      { userId: stored.userId, familyId: stored.familyId },
      "Concurrent refresh token use detected, whole token family revoked",
    );
    throw new UnauthorizedError("Invalid refresh token");
  }

  return { user: stored.user, tokens };
};

export const revokeSession = async (rawRefreshToken: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(rawRefreshToken) },
    select: { familyId: true },
  });

  if (stored) {
    await revokeFamily(prisma, stored.familyId);
  }
};
