import db from "../db/models/index.js";
import { exportPublishedPosts } from "./blog-export.service.js";
import { looksLikeHtml, sanitizeArticleHtml } from "../utils/blog-content.js";

/**
 * Blog post business logic. Every change re-exports the published posts so
 * the public site stays in step with the database after its next build.
 */

const today = () => new Date().toISOString().slice(0, 10);

/** Cleans editor HTML and sets the publish date: a published post always has one. */
function prepareData(data, existing) {
  const next = { ...data };
  if (looksLikeHtml(next.content)) next.content = sanitizeArticleHtml(next.content);
  const status = next.status ?? existing?.status ?? "draft";
  if (status === "published" && !next.publishedAt && !existing?.publishedAt) {
    next.publishedAt = today();
  }
  return next;
}

export async function listBlogPosts() {
  return db.BlogPost.findAll({ order: [["updatedAt", "DESC"]] });
}

export async function getBlogPost(id) {
  return db.BlogPost.findByPk(id);
}

/** Only one post can be the featured story, so featuring one clears the others. */
async function clearOtherFeatured(keepId) {
  const { Op } = db.Sequelize;
  await db.BlogPost.update({ featured: false }, { where: { featured: true, id: { [Op.ne]: keepId } } });
}

export async function createBlogPost(data) {
  const post = await db.BlogPost.create(prepareData(data));
  if (post.featured) await clearOtherFeatured(post.id);
  await exportPublishedPosts();
  return post;
}

/** Returns null when the id does not exist. */
export async function updateBlogPost(id, data) {
  const post = await db.BlogPost.findByPk(id);
  if (!post) return null;
  await post.update(prepareData(data, post));
  if (post.featured) await clearOtherFeatured(post.id);
  await exportPublishedPosts();
  return post;
}

/** Returns false when the id does not exist. */
export async function deleteBlogPost(id) {
  const post = await db.BlogPost.findByPk(id);
  if (!post) return false;
  await post.destroy();
  await exportPublishedPosts();
  return true;
}
