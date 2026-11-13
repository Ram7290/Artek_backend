import db from "../db/models/index.js";
import { sendEnquiryNotification } from "./mail.service.js";

/**
 * Enquiry business logic — no Express types in here, so the same service can
 * be called from HTTP, CLI scripts or a future job queue.
 */

/** Persists a validated enquiry, converting empty optional strings to NULL. */
export async function createEnquiry(data) {
  return db.Enquiry.create({
    ...data,
    companyName: data.companyName || null,
    message: data.message || null,
  });
}

/**
 * Saves the lead, then notifies ARTEK. The save is the hard requirement: if it
 * fails the caller gets the error, but if only the email fails the lead is kept
 * and `notificationStatus` records what happened.
 */
export async function submitEnquiry(data) {
  const enquiry = await createEnquiry(data);
  const notificationStatus = await sendEnquiryNotification(enquiry);
  await enquiry.update({ notificationStatus }).catch(() => undefined);
  return { enquiry, notificationStatus };
}

/**
 * Admin listing: newest first, optional status filter and free-text search.
 * `count` is the total matching the filter, independent of pagination.
 */
export async function listEnquiries({ limit = 25, offset = 0, status, q } = {}) {
  const { Op } = db.Sequelize;
  const where = {};
  if (status) where.status = status;
  if (q) {
    const like = { [Op.iLike]: `%${q}%` };
    where[Op.or] = [{ fullName: like }, { email: like }, { phone: like }, { companyName: like }, { service: like }];
  }

  const { rows, count } = await db.Enquiry.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  return { items: rows, total: count, limit, offset };
}

/** Single enquiry, including its message. */
export async function getEnquiry(id) {
  return db.Enquiry.findByPk(id);
}

/** Staff workflow update. Returns null when the id does not exist. */
export async function updateEnquiryStatus(id, status) {
  const enquiry = await db.Enquiry.findByPk(id);
  if (!enquiry) return null;
  await enquiry.update({ status });
  return enquiry;
}

/** Counts per status, for the dashboard's summary tiles. */
export async function statusCounts() {
  const rows = await db.Enquiry.findAll({
    attributes: ["status", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]],
    group: ["status"],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
}
