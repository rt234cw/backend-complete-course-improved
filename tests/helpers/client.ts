import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

let clientCount = 0;

const nextClientIp = () => {
  clientCount += 1;
  return `10.0.${Math.floor(clientCount / 256)}.${clientCount % 256}`;
};

export const createClient = (ip = nextClientIp()) => request.agent(app).set("X-Forwarded-For", ip);

export const authCookie = (accessToken: string) => ({ Cookie: `access_token=${accessToken}` });
