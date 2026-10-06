import { spawnSync } from "node:child_process";
import { config } from "dotenv";

const TEST_ENV_FILE = ".env.test";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const assertLocalTestDatabase = () => {
  const { NODE_ENV, DATABASE_URL } = process.env;

  if (NODE_ENV !== "test") {
    throw new Error(`Tests must run with NODE_ENV=test, got "${String(NODE_ENV)}"`);
  }

  if (!DATABASE_URL || !LOCAL_HOSTS.has(new URL(DATABASE_URL).hostname)) {
    throw new Error("Refusing to run tests: DATABASE_URL must point to a local database");
  }
};

const migrateTestDatabase = () => {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8" });

  if (result.status === 0) return;

  const output = `${result.stdout}${result.stderr}`.trim();
  const hint = output.includes("P1001")
    ? "Test database is not running. Start it with: npm run test:db"
    : "prisma migrate deploy failed on the test database";

  throw new Error(`${hint}\n\n${output}`);
};

export default function setup() {
  process.env.DOTENV_PATH = TEST_ENV_FILE;
  config({ path: TEST_ENV_FILE, quiet: true });

  assertLocalTestDatabase();

  migrateTestDatabase();
}
