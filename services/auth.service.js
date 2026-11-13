import bcrypt from "bcryptjs";
import db from "../db/models/index.js";

/**
 * Admin authentication.
 *
 * Password comparison uses bcrypt against the stored hash. A missing user and
 * a wrong password return the same failure, and bcrypt still runs against a
 * dummy hash for unknown emails, so response timing does not reveal which
 * accounts exist.
 */
const DUMMY_HASH = "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

export async function authenticate(email, password) {
  const user = await db.AdminUser.scope("withPassword").findOne({
    where: { email: email.toLowerCase() },
  });

  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return null;

  await user.update({ lastLoginAt: new Date() });
  const { passwordHash: _ignored, ...safe } = user.get({ plain: true });
  return safe;
}

export async function findAdminById(id) {
  return db.AdminUser.findByPk(id);
}
