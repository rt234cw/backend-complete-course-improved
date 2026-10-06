import type { Response } from "supertest";

export const getSetCookies = (res: Response): string[] => {
  const header = res.headers["set-cookie"];
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
};

export const findCookie = (res: Response, name: string) =>
  getSetCookies(res).find((cookie) => cookie.startsWith(`${name}=`));

export const getCookieValue = (res: Response, name: string): string => {
  const value = findCookie(res, name)
    ?.slice(name.length + 1)
    .split(";")[0];
  if (!value) throw new Error(`Cookie ${name} was not set`);
  return value;
};
