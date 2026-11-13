import "dotenv/config";
import { Sequelize } from "sequelize";
import { loadDbConfig } from "../config/index.js";

/**
 * Creates the database named in DATABASE_URL if it does not exist yet.
 * Connects to the `postgres` maintenance database, so it must be run before
 * the app on a fresh machine.
 *
 *   npm run db:create
 */
const { url } = loadDbConfig();
if (!url) {
  console.error("DATABASE_URL is not set — copy backend/.env.example to backend/.env");
  process.exit(1);
}

const target = new URL(url);
const dbName = decodeURIComponent(target.pathname.replace(/^\//, ""));
if (!dbName) {
  console.error("DATABASE_URL has no database name in its path.");
  process.exit(1);
}

const adminUrl = new URL(url);
adminUrl.pathname = `/${decodeURIComponent(target.searchParams.get("db") ?? "postgres")}`;

const admin = new Sequelize(adminUrl.toString(), { dialect: "postgres", logging: false });

try {
  await admin.authenticate();
  const [rows] = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", { bind: [dbName] });
  if (rows.length > 0) {
    console.info(`[db:create] "${dbName}" already exists`);
  } else {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.info(`[db:create] created "${dbName}"`);
  }
} catch (err) {
  console.error("[db:create] failed:", err.message);
  process.exitCode = 1;
} finally {
  await admin.close();
}
