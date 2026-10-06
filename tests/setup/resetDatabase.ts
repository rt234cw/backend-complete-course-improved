import { afterAll, beforeEach } from "vitest";
import { prisma } from "../../src/lib/prisma.js";

let truncateStatement: string | undefined;

const buildTruncateStatement = async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  const tableList = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");

  return `TRUNCATE TABLE ${tableList} CASCADE`;
};

beforeEach(async () => {
  truncateStatement ??= await buildTruncateStatement();
  await prisma.$executeRawUnsafe(truncateStatement);
});

afterAll(async () => {
  await prisma.$disconnect();
});
