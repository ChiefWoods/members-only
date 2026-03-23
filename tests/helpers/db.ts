import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const execFileAsync = promisify(execFile);
let schemaSyncPromise: Promise<void> | null = null;

type TestDbContext = {
  prisma: PrismaClient;
  reset: () => Promise<void>;
  close: () => Promise<void>;
};

function getProjectRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  return path.resolve(currentDir, "../..");
}

async function syncTestSchema(databaseUrl: string): Promise<void> {
  await execFileAsync("bunx", ["--bun", "prisma", "db", "push", "--accept-data-loss"], {
    cwd: getProjectRoot(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });
}

function ensureSchemaSynced(databaseUrl: string): Promise<void> {
  if (!schemaSyncPromise) {
    schemaSyncPromise = syncTestSchema(databaseUrl);
  }
  return schemaSyncPromise;
}

export async function createTestDb(): Promise<TestDbContext> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL for database-backed tests.");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  const reset = async (): Promise<void> => {
    await ensureSchemaSynced(databaseUrl);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "Passcode", "Message", "Session", "Account", "Verification", "User" RESTART IDENTITY CASCADE;`,
    );
  };

  await reset();

  return {
    prisma,
    reset,
    close: async () => {
      await prisma.$disconnect();
    },
  };
}
