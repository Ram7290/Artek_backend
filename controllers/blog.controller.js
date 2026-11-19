import { blogPostSchema, blogPostUpdateSchema, fieldErrors } from "../utils/validation.js";
import {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../services/blog.service.js";
import { saveImage } from "../services/upload.service.js";

const DUPLICATE_SLUG = "Another post already uses this URL slug. Choose a different one.";
const isDuplicateSlug = (err) => err?.name === "SequelizeUniqueConstraintError";

/** GET /api/admin/blog */
export async function blogIndex(_req, res) {
  const items = await listBlogPosts();
  return res.json({ ok: true, items });
}

/** GET /api/admin/blog/:id */
export async function blogShow(req, res) {
  const post = await getBlogPost(req.params.id);
  if (!post) return res.status(404).json({ ok: false, error: "Post not found." });
  return res.json({ ok: true, post });
}

/** POST /api/admin/blog */
export async function blogCreate(req, res) {
  const parsed = blogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) });
  }
  try {
    const post = await createBlogPost(parsed.data);
    return res.status(201).json({ ok: true, post });
  } catch (err) {
    if (isDuplicateSlug(err)) return res.status(409).json({ ok: false, error: DUPLICATE_SLUG });
    throw err;
  }
}

/** PATCH /api/admin/blog/:id */
export async function blogUpdate(req, res) {
  const parsed = blogPostUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) });
  }
  try {
    const post = await updateBlogPost(req.params.id, parsed.data);
    if (!post) return res.status(404).json({ ok: false, error: "Post not found." });
    return res.json({ ok: true, post });
  } catch (err) {
    if (isDuplicateSlug(err)) return res.status(409).json({ ok: false, error: DUPLICATE_SLUG });
    throw err;
  }
}

/** DELETE /api/admin/blog/:id */
export async function blogDelete(req, res) {
  const removed = await deleteBlogPost(req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: "Post not found." });
  return res.json({ ok: true });
}

/** POST /api/admin/uploads — body: { data: "data:image/jpeg;base64,..." } */
export async function uploadImage(req, res) {
  const result = await saveImage(req.body?.data);
  if (result.error) return res.status(400).json({ ok: false, error: result.error });
  return res.json({ ok: true, url: result.url });
}
