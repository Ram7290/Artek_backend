import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import db from "../db/models/index.js";
import { contentToBlocks } from "../utils/blog-content.js";

/**
 * Writes every published post to the frontend as JSON. The site reads this
 * file at build time, so the existing blog pages, SEO and sitemap pick up
 * new posts after a rebuild without any other change.
 */
const here = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH =
  process.env.BLOG_EXPORT_PATH ?? resolve(here, "../../frontend/src/data/generated/blog-posts.json");

/** Shapes a database row like the BlogPost type in frontend/src/types. */
export function toSitePost(post) {
  const firstWord = post.title.split(/\s+/)[0].replace(/[^\p{L}\p{N}]/gu, "");
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    dek: post.dek,
    category: post.category,
    tags: [],
    authorId: post.authorId,
    publishedAt: post.publishedAt ?? new Date().toISOString().slice(0, 10),
    featured: post.featured,
    coverWord: firstWord || "Insights",
    ...(post.coverImage ? { coverImage: post.coverImage, coverAlt: post.coverAlt ?? post.title } : {}),
    body: contentToBlocks(post.content),
    relatedServices: [],
    status: "published",
    seo: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.dek,
    },
  };
}

export async function exportPublishedPosts() {
  const rows = await db.BlogPost.findAll({
    where: { status: "published" },
    order: [["publishedAt", "DESC"]],
  });
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(rows.map(toSitePost), null, 2)}\n`, "utf8");
  return rows.length;
}
