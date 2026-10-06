import type { AuthenticatedUser } from "../modules/auth/authTypes.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
