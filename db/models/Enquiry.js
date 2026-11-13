/**
 * Enquiry (quote request) model.
 *
 * Saved BEFORE any email is attempted, so a mail failure never loses a lead —
 * `notificationStatus` records whether ARTEK was told about it.
 * Relationships are declared in ./index.js.
 */
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "Enquiry",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      companyName: { type: DataTypes.STRING(160), allowNull: true },
      email: { type: DataTypes.STRING(254), allowNull: false },
      phone: { type: DataTypes.STRING(40), allowNull: false },
      service: { type: DataTypes.STRING(120), allowNull: false },
      emirate: { type: DataTypes.STRING(60), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: true },
      /** Page or form that produced the lead, e.g. "website-contact-form". */
      source: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "website-contact-form" },
      /** pending → sent | failed | skipped (development mode: logged, not sent). */
      notificationStatus: {
        type: DataTypes.ENUM("pending", "sent", "failed", "skipped"),
        allowNull: false,
        defaultValue: "pending",
      },
      /** Staff workflow state; defaults to "new", nothing moves it automatically. */
      status: {
        type: DataTypes.ENUM("new", "contacted", "quoted", "won", "lost"),
        allowNull: false,
        defaultValue: "new",
      },
    },
    { tableName: "enquiries" },
  );
}
