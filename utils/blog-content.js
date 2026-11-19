import sanitizeHtml from "sanitize-html";

/** Tags the rich-text editor may produce. Anything else is removed on save. */
const ARTICLE_SANITIZE = {
  allowedTags: ["p", "br", "strong", "em", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "table", "thead", "tbody", "tr", "th", "td"],
  allowedAttributes: { a: ["href", "title"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export const looksLikeHtml = (content) => /^\s*</.test(content ?? "");

/** Cleans editor HTML before it is saved, so only allowed markup is ever stored. */
export function sanitizeArticleHtml(html) {
  return sanitizeHtml(html ?? "", ARTICLE_SANITIZE);
}

const stripTags = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Editor HTML → site blocks. Each H2 becomes a real heading block (so the
 * table of contents works); the HTML between headings becomes html blocks.
 */
export function htmlToBlocks(html) {
  const blocks = [];
  for (const element of topLevelElements(html)) {
    const heading = /^<h2>([\s\S]*?)<\/h2>$/i.exec(element);
    if (heading) {
      const text = stripTags(heading[1]);
      blocks.push({ type: "h2", id: slugify(text) || `section-${blocks.length}`, text });
    } else {
      blocks.push({ type: "html", html: element, text: stripTags(element) });
    }
  }
  return blocks;
}

const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link"]);

/** Splits HTML into its top-level elements, e.g. "<p>…</p>", "<ul>…</ul>", keeping each one whole. */
function topLevelElements(html) {
  const elements = [];
  const tag = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi;
  let depth = 0;
  let start = -1;
  let match;
  while ((match = tag.exec(html))) {
    const [whole, closing, name] = match;
    if (VOID_TAGS.has(name.toLowerCase())) continue;
    if (!closing) {
      if (depth === 0) start = match.index;
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) elements.push(html.slice(start, match.index + whole.length));
    }
  }
  return elements;
}

/** Any stored article content → site blocks (HTML from the editor, or plain text). */
export function contentToBlocks(content) {
  return looksLikeHtml(content) ? htmlToBlocks(content) : textToBlocks(content);
}

/** URL-safe slug from any text, e.g. "SIRA CCTV — Dubai" → "sira-cctv-dubai". */
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Converts the editor's plain text into the site's block format:
 *   "## Heading"      → h2 (with an anchor id for the table of contents)
 *   "### Sub-heading" → h3
 *   "- item"          → list (consecutive items are grouped)
 *   anything else     → paragraph, one per line
 */
export function textToBlocks(text) {
  const blocks = [];
  let list = null;
  const flushList = () => {
    if (list) {
      blocks.push({ type: "ul", items: list });
      list = null;
    }
  };

  for (const raw of (text ?? "").replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("- ")) {
      list = list ?? [];
      list.push(line.slice(2).trim());
      continue;
    }
    flushList();
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
    } else if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      blocks.push({ type: "h2", id: slugify(heading) || `section-${blocks.length}`, text: heading });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  flushList();
  return blocks;
}
