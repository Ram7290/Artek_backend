import "dotenv/config";
import db, { sequelize, modelNames } from "../models/index.js";

/**
 * Creates / updates the schema from the Sequelize models — the CLI equivalent
 * of the commented `sync()` in server.js.
 *   npm run db:sync          — create missing tables
 *   npm run db:sync:alter    — also add new columns to existing tables
 */
const alter = process.argv.includes("--alter") || process.env.DB_SYNC_ALTER === "true";

await sequelize.authenticate();
console.info(`[db] connected to ${sequelize.getDatabaseName()}`);

await db.sequelize.sync({ alter });
console.info(`[db] sync${alter ? " (alter)" : ""} complete for: ${modelNames.join(", ")}`);

await sequelize.close();
