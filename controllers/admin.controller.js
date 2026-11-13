import { loginSchema, enquiryStatusSchema, fieldErrors } from "../utils/validation.js";
import { authenticate, findAdminById } from "../services/auth.service.js";
import { listEnquiries, getEnquiry, updateEnquiryStatus, statusCounts } from "../services/enquiry.service.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { ENQUIRY_STATUSES } from "../utils/constants.js";

// ── Auth ─────────────────────────────────────────────────────────────────

/** POST /api/admin/login */
export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Enter your email and password.", fields: fieldErrors(parsed.error) });
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return res.status(401).json({ ok: false, error: "Incorrect email or password." });

  setAuthCookie(res, signToken(user));
  return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

/** POST /api/admin/logout */
export function logout(_req, res) {
  clearAuthCookie(res);
  return res.json({ ok: true });
}

/** GET /api/admin/me — used by the admin SPA to restore a session on load. */
export async function me(req, res) {
  const user = await findAdminById(req.user.id);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ ok: false, error: "Account no longer exists." });
  }
  return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

// ── Enquiries (protected) ────────────────────────────────────────────────

/** GET /api/admin/enquiries?limit=&offset=&status=&q= */
export async function index(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const status = ENQUIRY_STATUSES.includes(req.query.status) ? req.query.status : undefined;
  const q = typeof req.query.q === "string" && req.query.q.trim() ? req.query.q.trim().slice(0, 120) : undefined;

  const result = await listEnquiries({ limit, offset, status, q });
  return res.json({ ok: true, ...result });
}

/** GET /api/admin/enquiries/:id */
export async function show(req, res) {
  const enquiry = await getEnquiry(req.params.id);
  if (!enquiry) return res.status(404).json({ ok: false, error: "Enquiry not found." });
  return res.json({ ok: true, enquiry });
}

/** PATCH /api/admin/enquiries/:id — staff workflow status only. */
export async function updateStatus(req, res) {
  const parsed = enquiryStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: `Status must be one of: ${ENQUIRY_STATUSES.join(", ")}` });
  }

  const enquiry = await updateEnquiryStatus(req.params.id, parsed.data.status);
  if (!enquiry) return res.status(404).json({ ok: false, error: "Enquiry not found." });
  return res.json({ ok: true, enquiry });
}

/** GET /api/admin/enquiries/stats */
export async function stats(_req, res) {
  const counts = await statusCounts();
  return res.json({ ok: true, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) });
}
