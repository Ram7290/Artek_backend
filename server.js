import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import db, { sequelize, modelNames } from "./db/models/index.js";
import { enquiryRoutes } from "./routes/enquiry.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";

/**
 * ARTEK API.
 *
 *   routes → controllers → services → models (Sequelize)
 *
 * Public:  /api/enquiries (website form), /api/health
 * Admin:   /api/admin/* (JWT in an httpOnly cookie)
 */
const app = express();
app.disable("x-powered-by");

const origins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// credentials:true is required for the admin cookie to flow between origins.
app.use(cors({ origin: origins, credentials: true, methods: ["GET", "POST", "PATCH"], maxAge: 86400 }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

/** Liveness + database check for uptime monitors and hosting health checks. */
app.get("/api/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: "up", env: process.env.NODE_ENV ?? "development" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

// ── Route registration ───────────────────────────────────────────────────
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((err, _req, res, _next) => {
  console.error("[api] unhandled error:", err);
  res.status(500).json({ ok: false, error: "Something went wrong. Please call +971 4 379 7128." });
});

const port = Number(process.env.PORT ?? 4000);

async function start() {
  await sequelize.authenticate();
  console.info(`[db] connected to ${sequelize.getDatabaseName()}`);
  console.info(`[db] models registered: ${modelNames.join(", ")}`);

  // Creates any missing tables from the models on every boot. Development
  // convenience only — leave it commented in production, where migrations
  // (or a deliberate `npm run db:sync`) own the schema. Uncomment + restart
  // after adding a model.
  // await db.sequelize.sync();

  app.listen(port, () => {
    console.info(`[api] ${process.env.NODE_ENV ?? "development"} mode — http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
