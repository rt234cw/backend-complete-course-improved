const SWAGGER_UI_VERSION = "5.33.1";

export const CDN_ORIGIN = "https://cdn.jsdelivr.net";

const assetUrl = (file: string) =>
  `${CDN_ORIGIN}/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/${file}`;

const STYLESHEET_INTEGRITY =
  "sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW";
const BUNDLE_INTEGRITY = "sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw";

export const swaggerUiHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Movie Watchlist API</title>
    <link
      rel="stylesheet"
      href="${assetUrl("swagger-ui.css")}"
      integrity="${STYLESHEET_INTEGRITY}"
      crossorigin="anonymous"
    />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script
      src="${assetUrl("swagger-ui-bundle.js")}"
      integrity="${BUNDLE_INTEGRITY}"
      crossorigin="anonymous"
    ></script>
    <script src="/api/docs/swagger-initializer.js"></script>
  </body>
</html>
`;

export const swaggerInitializerJs = `window.ui = SwaggerUIBundle({
  url: "/api/openapi.json",
  dom_id: "#swagger-ui",
  deepLinking: true,
});
`;
