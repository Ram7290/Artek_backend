import express, { Router } from "express";
import {
  login,
  logout,
  me,
  index,
  show,
  updateStatus,
  stats,
} from "../controllers/admin.controller.js";
import {
  blogIndex,
  blogShow,
  blogCreate,
  blogUpdate,
  blogDelete,
  uploadImage,
} from "../controllers/blog.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rateLimit.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.middleware.js";

/** Admin dashboard API — everything below /api/admin except login needs a JWT. */
export const adminRoutes = Router();

// Public
adminRoutes.post("/login", loginLimiter, asyncHandler(login));

// Authenticated
adminRoutes.post("/logout", requireAuth, logout);
adminRoutes.get("/me", requireAuth, asyncHandler(me));
adminRoutes.get("/enquiries", requireAuth, asyncHandler(index));
adminRoutes.get("/enquiries/stats", requireAuth, asyncHandler(stats));
adminRoutes.get("/enquiries/:id", requireAuth, asyncHandler(show));
adminRoutes.patch("/enquiries/:id", requireAuth, requireRole("admin", "staff"), asyncHandler(updateStatus));

adminRoutes.get("/blog", requireAuth, asyncHandler(blogIndex));
adminRoutes.get("/blog/:id", requireAuth, asyncHandler(blogShow));
adminRoutes.post("/blog", requireAuth, requireRole("admin", "staff"), asyncHandler(blogCreate));
adminRoutes.patch("/blog/:id", requireAuth, requireRole("admin", "staff"), asyncHandler(blogUpdate));
adminRoutes.delete("/blog/:id", requireAuth, requireRole("admin"), asyncHandler(blogDelete));
adminRoutes.post(
  "/uploads",
  requireAuth,
  requireRole("admin", "staff"),
  express.json({ limit: "8mb" }),
  asyncHandler(uploadImage),
);

export default adminRoutes;
