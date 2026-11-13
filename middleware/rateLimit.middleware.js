import rateLimit from "express-rate-limit";

/** Login: 10 attempts per IP per 15 minutes — slows password guessing. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { ok: false, error: "Too many sign-in attempts. Try again in a few minutes." },
});

/** Enquiries: 5 submissions per IP per 15 minutes. */
export const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { ok: false, error: "Too many enquiries from this address. Please call +971 4 379 7128." },
});
