import { writeFile } from "node:fs/promises";
import { createOpenApiDocument } from "../src/docs/openapi.js";

const outFile = new URL("../openapi.json", import.meta.url);

await writeFile(outFile, `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`);
