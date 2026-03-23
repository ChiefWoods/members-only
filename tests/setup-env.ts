import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    const isWrappedInSingleQuotes = value.startsWith("'") && value.endsWith("'");
    const isWrappedInDoubleQuotes = value.startsWith('"') && value.endsWith('"');
    if (isWrappedInSingleQuotes || isWrappedInDoubleQuotes) {
      value = value.slice(1, -1);
    }
    // Force test env values so integration tests always use test DB settings.
    process.env[key] = value;
  }
}

const projectRoot = process.cwd();
loadEnvFile(path.join(projectRoot, ".env.test"));
