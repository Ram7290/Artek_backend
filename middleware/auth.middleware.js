import { AUTH_COOKIE, ADMIN_ROLES } from "../utils/constants.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Requires a valid admin JWT. The token is read from the httpOnly cookie (what
 * the browser sends for the admin SPA) or, for scripts/tools, an
 * `Authorization: Bearer <token>` header.
 *
 * On success sets `req.user = { id, role, name }`. Never trusts a role sent by
 * the client — it comes from the signed token.
 */
export function requireAuth(req, res, next) {
  const header = req.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = req.cookies?.[AUTH_COOKIE] ?? bearer;

  if (!token) {
    return res.status(401).json({ ok: false, error: "Not signed in." });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Session expired — please sign in again." });
  }
}

/** Roles allowed for a route, e.g. `requireRole("admin")`. Must follow requireAuth. */
export function requireRole(...roles) {
  const invalid = roles.filter((r) => !ADMIN_ROLES.includes(r));
  if (invalid.length) throw new Error(`Unknown role(s): ${invalid.join(", ")}`);

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "You do not have access to this." });
    }
    return next();
  };
}
