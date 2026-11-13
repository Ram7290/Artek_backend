import jwt from "jsonwebtoken";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE_MS } from "../utils/constants.js";

/**
 * JWT helpers. The token is signed with JWT_SECRET and delivered as an
 * httpOnly cookie so the admin dashboard never holds it in JS (XSS-safe).
 */

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error(
    "JWT_SECRET is not set — add a long random value to backend/.env (e.g. `node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"`)",
  );
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, secret, {
    expiresIn: "8h",
    issuer: "artek-api",
    audience: "artek-admin",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, secret, { issuer: "artek-api", audience: "artek-admin" });
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
}
