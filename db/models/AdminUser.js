/**
 * Admin user — staff account for the enquiry dashboard.
 *
 * `passwordHash` is bcrypt; never store or log the plain password. Create the
 * first admin with `npm run admin:create`.
 */
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "AdminUser",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
      passwordHash: { type: DataTypes.STRING(72), allowNull: false },
      role: {
        type: DataTypes.ENUM("admin", "staff"),
        allowNull: false,
        defaultValue: "staff",
      },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "admin_users",
      defaultScope: { attributes: { exclude: ["passwordHash"] } },
      scopes: { withPassword: { attributes: {} } },
    },
  );
}
