import { Router } from "express";
import helmet from "helmet";
import { createOpenApiDocument } from "./openapi.js";
import { CDN_ORIGIN, swaggerInitializerJs, swaggerUiHtml } from "./swaggerUi.js";

export const docsRouter = Router();

let openApiDocument: ReturnType<typeof createOpenApiDocument> | undefined;

const swaggerUiCsp = helmet.contentSecurityPolicy({
  directives: { scriptSrc: ["'self'", CDN_ORIGIN] },
});

docsRouter.get("/openapi.json", (_req, res) => {
  openApiDocument ??= createOpenApiDocument();

  res.status(200).json(openApiDocument);
});

docsRouter.get("/docs", swaggerUiCsp, (_req, res) => {
  res.status(200).type("html").send(swaggerUiHtml);
});

docsRouter.get("/docs/swagger-initializer.js", (_req, res) => {
  res.status(200).type("js").send(swaggerInitializerJs);
});
