import nodemailer from "nodemailer";

/**
 * Enquiry notification — two modes, chosen by NODE_ENV.
 *
 *   development (default): NEVER sends email. The full message is printed to
 *                          the console and the enquiry is marked "skipped".
 *   production:            sends a real email over SMTP. Anything other than
 *                          NODE_ENV=production falls back to development, so a
 *                          misconfigured host can't start emailing by accident.
 *
 * Either way the lead is already saved in Postgres before this runs.
 */
const isProduction = process.env.NODE_ENV === "production";

const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

const transporter =
  isProduction && smtpConfigured
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

const escape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function bodyHtml(e) {
  const rows = [
    ["Name", e.fullName],
    ["Company", e.companyName],
    ["Email", e.email],
    ["Phone", e.phone],
    ["Service", e.service],
    ["Emirate", e.emirate],
    ["Source", e.source],
    ["Received", e.createdAt.toISOString()],
  ].filter(([, v]) => v);
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${escape(v)}</td></tr>`)
    .join("");
  const msg = e.message ? `<p style="white-space:pre-wrap">${escape(e.message)}</p>` : "<p>—</p>";
  return `<h2 style="margin:0 0 12px">New website enquiry</h2><table>${table}</table><h3 style="margin:20px 0 6px">Message</h3>${msg}`;
}

/**
 * Sends (production) or prints (development) the new-enquiry notification.
 * @returns {Promise<"sent" | "failed" | "skipped">}
 */
export async function sendEnquiryNotification(enquiry) {
  const subject = `Website enquiry — ${enquiry.service} (${enquiry.fullName})`;
  const text = [
    `Name:      ${enquiry.fullName}`,
    `Company:   ${enquiry.companyName || "—"}`,
    `Email:     ${enquiry.email}`,
    `Phone:     ${enquiry.phone}`,
    `Service:   ${enquiry.service}`,
    `Emirate:   ${enquiry.emirate}`,
    `Source:    ${enquiry.source}`,
    `Received:  ${enquiry.createdAt.toISOString()}`,
    "",
    enquiry.message || "(no message)",
  ].join("\n");

  if (!isProduction) {
    console.info(
      [
        "",
        "╭─ [development] enquiry email NOT sent (console only) ─────────────",
        `│ To:      ${process.env.MAIL_TO ?? "info@artekteam.com"}`,
        `│ Subject: ${subject}`,
        ...text.split("\n").map((line) => `│ ${line}`),
        "╰───────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return "skipped";
  }

  if (!transporter) {
    console.warn("[mail] NODE_ENV=production but SMTP_* is not configured — enquiry saved, no email sent");
    return "failed";
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? "Artek Website <noreply@artekteam.com>",
      to: (process.env.MAIL_TO ?? "info@artekteam.com").split(",").map((s) => s.trim()),
      replyTo: `${enquiry.fullName} <${enquiry.email}>`,
      subject,
      text,
      html: bodyHtml(enquiry),
    });
    return "sent";
  } catch (err) {
    console.error("[mail] failed to notify ARTEK — enquiry is still saved:", err);
    return "failed";
  }
}
