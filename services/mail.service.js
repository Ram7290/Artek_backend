import nodemailer from "nodemailer";

/**
 * Enquiry notification.
 *
 *   SMTP configured: sends a real email over SMTP.
 *   SMTP not set:    prints the full message to the console and the enquiry
 *                    is marked "skipped" — the lead is still saved in Postgres.
 *
 * Either way the lead is already saved in Postgres before this runs.
 */
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

/**
 * Recipient list — development routes to the test address, production to the
 * live ARTEK inbox. Set via MAIL_TO_DEV / MAIL_TO in the environment.
 */
const isProduction = process.env.NODE_ENV === "production";
const recipients = (isProduction
  ? process.env.MAIL_TO ?? "info@artekteam.com"
  : process.env.MAIL_TO_DEV ?? "ram@taiqontech.com"
).split(",").map((s) => s.trim());

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
 * Sends the new-enquiry notification over SMTP, or logs to console when
 * SMTP is not configured. The enquiry is already saved either way.
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

  if (!transporter) {
    console.info(
      [
        "",
        "╭─ [log-only] enquiry email NOT sent (SMTP not configured) ─────────",
        `│ To:      ${recipients.join(", ")}`,
        `│ Subject: ${subject}`,
        ...text.split("\n").map((line) => `│ ${line}`),
        "╰───────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return "skipped";
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? "Artek Website <noreply@artekteam.com>",
      to: recipients,
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
