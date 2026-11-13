/** Shared constants — enums must match the Sequelize model definitions. */

export const ADMIN_ROLES = /** @type {const} */ (["admin", "staff"]);

export const ENQUIRY_STATUSES = /** @type {const} */ (["new", "contacted", "quoted", "won", "lost"]);

export const NOTIFICATION_STATUSES = /** @type {const} */ (["pending", "sent", "failed", "skipped"]);

/** Cookie holding the admin JWT. httpOnly — JS never reads it. */
export const AUTH_COOKIE = "artek_admin";

export const AUTH_COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
