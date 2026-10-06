import { createHash } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
//用bcrypt or bcryptjs幾乎都差不多，前者是核心部分用c++計算，透過node.js讓js調用。後者是純js
import bcrypt from "bcrypt";
import { ConflictError, TooManyRequestsError, UnauthorizedError } from "../../errors/AppError.js";
import {
  isRateLimiterRes,
  loginFailureLimiter,
  toRetryAfterSeconds,
} from "../../lib/rateLimiter.js";
import type { LoginInput, SignupInput } from "./authSchemas.js";
import { BCRYPT_COST } from "./password.js";
import { authUserSelect, type AuthUser } from "./authTypes.js";

const DUMMY_PASSWORD_HASH = "$2b$12$JUjd/s/sG85X98Jy3O4JleobjQK692pbjU11V5AvmkKHGJH7.klOi";

export const registerUser = async ({ name, email, password }: SignupInput): Promise<AuthUser> => {
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new ConflictError("User already exists");
  }

  const salt = await bcrypt.genSalt(BCRYPT_COST);
  const hashedPassword = await bcrypt.hash(password, salt);
  //也可以直接寫 const hashedPassword = bcrypt.hash(password,10) ，第二個參數是union type可放數字或字串

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: authUserSelect,
  });
};

export const getUserById = async (id: string): Promise<AuthUser> => {
  const user = await prisma.user.findUnique({ where: { id }, select: authUserSelect });

  if (!user) {
    throw new UnauthorizedError("User no longer exists");
  }

  return user;
};

const loginFailureKey = (email: string) => createHash("sha256").update(email).digest("hex");

const assertNotLocked = async (key: string) => {
  const status = await loginFailureLimiter.get(key);

  if (status && status.remainingPoints <= 0) {
    throw new TooManyRequestsError(
      toRetryAfterSeconds(status),
      "Too many failed login attempts, please try again later",
    );
  }
};

const recordLoginFailure = async (key: string) => {
  try {
    await loginFailureLimiter.consume(key);
  } catch (error) {
    if (!isRateLimiterRes(error)) throw error;
  }
};

export const authenticate = async ({ email, password }: LoginInput): Promise<AuthUser> => {
  const failureKey = loginFailureKey(email);
  await assertNotLocked(failureKey);

  const existedUser = await prisma.user.findUnique({
    where: { email },
  });

  const correctPassword = await bcrypt.compare(
    password,
    existedUser?.password ?? DUMMY_PASSWORD_HASH,
  );

  if (!existedUser || !correctPassword) {
    await recordLoginFailure(failureKey);
    throw new UnauthorizedError("Invalid email or password");
  }

  await loginFailureLimiter.delete(failureKey);

  return {
    id: existedUser.id,
    name: existedUser.name,
    email: existedUser.email,
  };
};
