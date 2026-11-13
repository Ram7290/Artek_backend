import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Sequelize, DataTypes } from "sequelize";
import { loadDbConfig } from "../config/index.js";

/**
 * Sequelize registry — the single place models and relationships live.
 *
 * 1. Every model file in ./models (except this one) default-exports a factory
 *    `(sequelize, DataTypes) => Model`.
 * 2. All associations are declared here, after every model is registered, so
 *    association order never matters.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

const cfg = loadDbConfig();
const url = cfg.url ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set — copy backend/.env.example to backend/.env");
}

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

const sequelize = new Sequelize(url, {
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  dialectOptions: isLocal ? {} : { ssl: { require: true, rejectUnauthorized: false } },
  pool: { max: 5, min: 0, idle: 10_000, acquire: 30_000 },
});

const db = { sequelize, Sequelize, DataTypes };

const modelsDir = __dirname;
const files = readdirSync(modelsDir).filter(
  (f) => f.endsWith(".js") && f !== "index.js" && !f.endsWith(".test.js"),
);

for (const file of files) {
  const factory = (await import(pathToFileURL(join(modelsDir, file)).href)).default;
  const model = factory(sequelize, DataTypes);
  db[model.name] = model;
}

// ── Relationships ─────────────────────────────────────────────────────────
// Enquiries are standalone leads today (no foreign keys). Add associations
// here when notes / assignees exist, e.g.:
//
//   const { Enquiry, EnquiryNote, AdminUser } = db;
//   Enquiry.hasMany(EnquiryNote, { as: "notes", foreignKey: "enquiryId", onDelete: "CASCADE" });
//   EnquiryNote.belongsTo(Enquiry, { as: "enquiry", foreignKey: "enquiryId" });
//   AdminUser.hasMany(Enquiry, { as: "assignedEnquiries", foreignKey: "assignedToId" });
//   Enquiry.belongsTo(AdminUser, { as: "assignedTo", foreignKey: "assignedToId" });

export const modelNames = Object.keys(db).filter(
  (k) => !["sequelize", "Sequelize", "DataTypes"].includes(k),
);

export { sequelize, Sequelize, DataTypes };
export default db;
