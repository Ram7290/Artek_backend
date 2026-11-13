import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolves backend/db/config/config.json for the current NODE_ENV.
 * The JSON holds only non-secrets (dialect, env variable name); the actual
 * connection string always comes from DATABASE_URL.
 */
export function loadDbConfig(env = process.env.NODE_ENV ?? "development") {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const json = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf8"));
  const base = json[env] ?? json.development;
  if (base.use_env_variable) {
    const url = process.env[base.use_env_variable];
    if (!url) throw new Error(`${base.use_env_variable} is not set`);
    return { ...base, url };
  }
  return base;
}
