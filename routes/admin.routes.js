import { Router } from "express";
import {
  login,
  logout,
  me,
  index,
  show,
  updateStatus,
  stats,
} from "../controllers/admin.controller.js";
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

export default adminRoutes;
