import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";

const ACCESS_TOKEN_ALGORITHM = "HS256";

const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
});

export const signAccessToken = (userId: string) => {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: ACCESS_TOKEN_ALGORITHM,
    subject: userId,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
};

export const verifyAccessToken = (token: string): string => {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ACCESS_TOKEN_ALGORITHM],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  return accessTokenPayloadSchema.parse(payload).sub;
};

export const generateRefreshToken = () => randomBytes(32).toString("base64url");

export const hashRefreshToken = (token: string) => createHash("sha256").update(token).digest("hex");
