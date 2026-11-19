import { enquirySchema, fieldErrors } from "../utils/validation.js";
import { submitEnquiry } from "../services/enquiry.service.js";

/**
 * POST /api/enquiries — public.
 * 1. validate (Zod)   → 400 with field errors
 * 2. honeypot         → 200 no-op (silently drop bots, no row created)
 * 3. save + notify    → service; 500 only if the lead could not be stored
 */
export async function createEnquiry(req, res) {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) });
  }

  const { website, ...data } = parsed.data;
  if (website) return res.status(200).json({ ok: true });

  try {
    const { enquiry } = await submitEnquiry(data);
    return res.status(201).json({ ok: true, id: enquiry.id });
  } catch (err) {
    console.error("[enquiries] failed to save:", err);
    return res.status(500).json({
      ok: false,
      error: "We could not save your enquiry. Please call +971 50 5513139 or email info@artekteam.com.",
    });
  }
}
