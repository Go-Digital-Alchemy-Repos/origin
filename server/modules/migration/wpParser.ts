import { XMLParser } from "fast-xml-parser";

export interface WpItem {
  title: string;
  link: string;
  slug: string;
  type: "page" | "post" | "attachment";
  status: string;
  content: string;
  excerpt: string;
  pubDate: string;
  creator: string;
  attachmentUrl?: string;
  categories: string[];
  tags: string[];
}

export interface WpExportData {
  siteTitle: string;
  siteUrl: string;
  pages: WpItem[];
  posts: WpItem[];
  media: WpItem[];
}

function ensureArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function extractSlug(link: string, fallbackTitle: string): string {
  try {
    const url = new URL(link);
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    return parts[parts.length - 1] || slugify(fallbackTitle);
  } catch {
    return slugify(fallbackTitle);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100) || "untitled";
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function wpPermalink(item: any): string {
  const link = item.link || "";
  try {
    const url = new URL(link);
    return url.pathname;
  } catch {
    return "";
  }
}

export function parseWpExport(xmlString: string): WpExportData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true,
    trimValues: true,
    cdataPropName: "__cdata",
    processEntities: true,
    htmlEntities: true,
  });

  const doc = parser.parse(xmlString);
  const channel = doc?.rss?.channel;
  if (!channel) {
    throw new Error("Invalid WordPress export file: missing rss > channel structure");
  }

  const siteTitle = channel.title || "Imported Site";
  const siteUrl = channel.link || "";
  const items = ensureArray(channel.item);

  const pages: WpItem[] = [];
  const posts: WpItem[] = [];
  const media: WpItem[] = [];

  for (const raw of items) {
    const wpNs = raw["wp:post_type"] || raw.post_type;
    const postType = typeof wpNs === "object" ? (wpNs.__cdata || wpNs["#text"] || "") : String(wpNs || "");

    const title = extractText(raw.title) || "Untitled";
    const link = extractText(raw.link) || "";
    const slug = extractText(raw["wp:post_name"] || raw.post_name) || extractSlug(link, title);
    const status = extractText(raw["wp:status"] || raw.status) || "draft";
    const content = extractText(raw["content:encoded"] || raw.content) || "";
    const excerpt = extractText(raw["excerpt:encoded"] || raw.excerpt) || "";
    const pubDate = extractText(raw.pubDate) || "";
    const creator = extractText(raw["dc:creator"] || raw.creator) || "";
    const attachmentUrl = extractText(raw["wp:attachment_url"] || raw.attachment_url) || undefined;

    const cats: string[] = [];
    const tagsList: string[] = [];
    for (const cat of ensureArray(raw.category)) {
      if (typeof cat === "string") {
        cats.push(cat);
      } else if (cat) {
        const domain = cat["@_domain"] || "";
        const nicename = cat["@_nicename"] || extractText(cat) || "";
        if (domain === "category") cats.push(nicename);
        else if (domain === "post_tag") tagsList.push(nicename);
      }
    }

    const item: WpItem = {
      title,
      link,
      slug,
      type: postType === "page" ? "page" : postType === "attachment" ? "attachment" : "post",
      status,
      content,
      excerpt: stripHtmlToText(excerpt),
      pubDate,
      creator,
      attachmentUrl,
      categories: cats,
      tags: tagsList,
    };

    if (postType === "page") {
      pages.push(item);
    } else if (postType === "attachment") {
      media.push(item);
    } else if (postType === "post") {
      posts.push(item);
    }
  }

  return { siteTitle, siteUrl, pages, posts, media };
}

function extractText(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (val.__cdata !== undefined) return String(val.__cdata);
  if (val["#text"] !== undefined) return String(val["#text"]);
  return String(val);
}

export function generateRedirectSuggestions(
  wpData: WpExportData,
  importedPages: Array<{ wpSlug: string; newSlug: string }>,
  importedPosts: Array<{ wpSlug: string; newSlug: string }>,
): Array<{ fromPath: string; toUrl: string }> {
  const suggestions: Array<{ fromPath: string; toUrl: string }> = [];

  for (const page of wpData.pages) {
    const permalink = wpPermalink(page);
    if (!permalink || permalink === "/") continue;

    const mapped = importedPages.find((p) => p.wpSlug === page.slug);
    const targetSlug = mapped?.newSlug || page.slug;

    if (permalink !== `/${targetSlug}` && permalink !== `/${targetSlug}/`) {
      suggestions.push({
        fromPath: permalink,
        toUrl: `/${targetSlug}`,
      });
    }
  }

  for (const post of wpData.posts) {
    const permalink = wpPermalink(post);
    if (!permalink || permalink === "/") continue;

    const mapped = importedPosts.find((p) => p.wpSlug === post.slug);
    const targetSlug = mapped?.newSlug || post.slug;

    suggestions.push({
      fromPath: permalink,
      toUrl: `/blog/${targetSlug}`,
    });
  }

  return suggestions;
}
