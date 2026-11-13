import "dotenv/config";
import { parseArgs } from "node:util";
import bcrypt from "bcryptjs";
import db, { sequelize } from "../models/index.js";
import { ADMIN_ROLES } from "../../utils/constants.js";

/**
 * Creates (or resets the password of) an admin user.
 *
 *   npm run admin:create -- --name "Ram" --email admin@artekteam.com --password "S3cret!" --role admin
 *
 * Never logs the password. Use the same fields when adding staff accounts.
 */
const { values } = parseArgs({
  options: {
    name: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    role: { type: "string", default: "admin" },
  },
});

const { name, email, password } = values;
const role = values.role;

if (!name || !email || !password) {
  console.error('Usage: npm run admin:create -- --name "Ram" --email admin@artekteam.com --password "S3cret!" [--role admin|staff]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
if (!ADMIN_ROLES.includes(role)) {
  console.error(`Role must be one of: ${ADMIN_ROLES.join(", ")}`);
  process.exit(1);
}

await sequelize.authenticate();
await db.sequelize.sync(); // ensure admin_users exists

const passwordHash = await bcrypt.hash(password, 12);
const existing = await db.AdminUser.unscoped().findOne({ where: { email: email.toLowerCase() } });

if (existing) {
  await existing.update({ name, passwordHash, role });
  console.info(`[admin:create] updated existing admin "${email}" (role: ${role})`);
} else {
  await db.AdminUser.create({ name, email: email.toLowerCase(), passwordHash, role });
  console.info(`[admin:create] created admin "${email}" (role: ${role})`);
}

await sequelize.close();
