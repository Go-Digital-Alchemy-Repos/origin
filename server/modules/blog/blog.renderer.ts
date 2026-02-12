import type { PublishedBlogPost } from "./blog.service";

interface BlogRenderOptions {
  site: { name: string; slug: string };
  seoDefaults?: { titleSuffix?: string | null; defaultOgImage?: string | null; defaultIndexable?: boolean };
  baseUrl?: string;
  headerNav: string;
  footerHtml: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function renderBaseHtml(opts: BlogRenderOptions & { title: string; meta: string; body: string; structuredData?: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}${opts.seoDefaults?.titleSuffix ? ` | ${escapeHtml(opts.seoDefaults.titleSuffix)}` : ""}</title>
  ${opts.meta}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${opts.structuredData || ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    img { max-width: 100%; height: auto; }
    .nav-item:hover > .nav-dropdown { display: block !important; }
    .nav-item > a:hover { color: #2563eb; }
    .blog-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; transition: box-shadow 0.2s; }
    .blog-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .blog-card a { text-decoration: none; color: inherit; }
    .blog-card img { width: 100%; height: 200px; object-fit: cover; }
    .blog-card-body { padding: 20px; }
    .blog-card h3 { font-size: 1.125rem; font-weight: 600; margin: 0 0 8px; color: #111827; }
    .blog-card p { font-size: 0.875rem; color: #6b7280; margin: 0 0 12px; }
    .blog-card-meta { font-size: 0.75rem; color: #9ca3af; display: flex; gap: 12px; flex-wrap: wrap; }
    .blog-category { display: inline-block; font-size: 0.75rem; font-weight: 500; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 4px; }
    .article-content { white-space: pre-wrap; }
    .article-content h1, .article-content h2, .article-content h3 { margin: 1.5em 0 0.5em; }
    .article-content p { margin: 0 0 1em; }
    @media (max-width: 768px) {
      .blog-grid { grid-template-columns: 1fr !important; }
    }
  </style>
</head>
<body>
  ${opts.headerNav}
  <main>
    ${opts.body}
  </main>
  <footer style="border-top:1px solid #e5e7eb;padding:24px;text-align:center;font-size:0.75rem;color:#9ca3af">
    ${opts.footerHtml}
    <span>Powered by ORIGIN</span>
  </footer>
</body>
</html>`;
}

export function renderBlogIndex(posts: PublishedBlogPost[], opts: BlogRenderOptions): string {
  const description = "Read our latest articles, news, and insights.";
  const canonicalUrl = opts.baseUrl ? `${opts.baseUrl}/blog` : "";

  let meta = `<meta name="description" content="${escapeHtml(description)}">`;
  meta += `\n  <meta property="og:title" content="Blog${opts.seoDefaults?.titleSuffix ? ` | ${escapeHtml(opts.seoDefaults.titleSuffix)}` : ""}">`;
  meta += `\n  <meta property="og:description" content="${escapeHtml(description)}">`;
  meta += `\n  <meta property="og:type" content="website">`;
  if (canonicalUrl) meta += `\n  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;

  let body = `<div style="max-width:1200px;margin:0 auto;padding:48px 24px">`;
  body += `<h1 style="font-size:2rem;font-weight:700;margin:0 0 8px">Blog</h1>`;
  body += `<p style="color:#6b7280;margin:0 0 32px">Latest articles and insights</p>`;

  if (posts.length === 0) {
    body += `<p style="color:#9ca3af;text-align:center;padding:48px 0">No posts published yet.</p>`;
  } else {
    body += `<div class="blog-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">`;
    for (const post of posts) {
      const href = `/blog/${escapeHtml(post.slug)}`;
      const date = formatDate(post.publishedDate || post.updatedAt?.toISOString() || "");
      body += `<article class="blog-card">
        <a href="${href}">
          ${post.featuredImage ? `<img src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.title)}" loading="lazy">` : `<div style="height:200px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:0.875rem">No image</div>`}
          <div class="blog-card-body">
            ${post.category ? `<span class="blog-category">${escapeHtml(post.category)}</span>` : ""}
            <h3>${escapeHtml(post.title)}</h3>
            ${post.excerpt ? `<p>${escapeHtml(post.excerpt.substring(0, 160))}${post.excerpt.length > 160 ? "..." : ""}</p>` : ""}
            <div class="blog-card-meta">
              ${post.author ? `<span>${escapeHtml(post.author)}</span>` : ""}
              ${date ? `<span>${date}</span>` : ""}
            </div>
          </div>
        </a>
      </article>`;
    }
    body += `</div>`;
  }
  body += `</div>`;

  return renderBaseHtml({ ...opts, title: "Blog", meta, body });
}

export function renderBlogPost(post: PublishedBlogPost, opts: BlogRenderOptions): string {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || "";
  const ogImage = post.ogImage || post.featuredImage || opts.seoDefaults?.defaultOgImage || "";
  const canonicalUrl = opts.baseUrl ? `${opts.baseUrl}/blog/${post.slug}` : "";
  const date = formatDate(post.publishedDate || post.updatedAt?.toISOString() || "");
  const isoDate = post.publishedDate || post.updatedAt?.toISOString() || "";

  let meta = description ? `<meta name="description" content="${escapeHtml(description)}">` : "";
  meta += `\n  <meta property="og:title" content="${escapeHtml(title)}">`;
  if (description) meta += `\n  <meta property="og:description" content="${escapeHtml(description)}">`;
  if (ogImage) meta += `\n  <meta property="og:image" content="${escapeHtml(ogImage)}">`;
  meta += `\n  <meta property="og:type" content="article">`;
  if (isoDate) meta += `\n  <meta property="article:published_time" content="${escapeHtml(isoDate)}">`;
  if (post.author) meta += `\n  <meta property="article:author" content="${escapeHtml(post.author)}">`;
  if (post.category) meta += `\n  <meta property="article:section" content="${escapeHtml(post.category)}">`;
  if (post.tags) {
    post.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(tag => {
      meta += `\n  <meta property="article:tag" content="${escapeHtml(tag)}">`;
    });
  }
  if (canonicalUrl) meta += `\n  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;

  const structuredData = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: description || undefined,
    image: post.featuredImage || ogImage || undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    datePublished: isoDate || undefined,
    dateModified: post.updatedAt?.toISOString() || isoDate || undefined,
    publisher: {
      "@type": "Organization",
      name: opts.site.name,
    },
    mainEntityOfPage: canonicalUrl || undefined,
  })}</script>`;

  let body = `<article style="max-width:768px;margin:0 auto;padding:48px 24px">`;
  body += `<div style="margin-bottom:24px">
    <a href="/blog" style="font-size:0.875rem;color:#2563eb;text-decoration:none;font-weight:500">&larr; Back to Blog</a>
  </div>`;

  if (post.category) {
    body += `<span class="blog-category" style="margin-bottom:12px;display:inline-block">${escapeHtml(post.category)}</span>`;
  }

  body += `<h1 style="font-size:2rem;font-weight:700;margin:0 0 12px;line-height:1.3">${escapeHtml(post.title)}</h1>`;

  const metaParts: string[] = [];
  if (post.author) metaParts.push(escapeHtml(post.author));
  if (date) metaParts.push(date);
  if (metaParts.length > 0) {
    body += `<div style="font-size:0.875rem;color:#6b7280;margin-bottom:24px">${metaParts.join(" &middot; ")}</div>`;
  }

  if (post.featuredImage) {
    body += `<img src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.title)}" style="width:100%;border-radius:8px;margin-bottom:32px;max-height:400px;object-fit:cover">`;
  }

  body += `<div class="article-content" style="font-size:1rem;line-height:1.8;color:#374151">${escapeHtml(post.body)}</div>`;

  if (post.tags) {
    const tagList = post.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      body += `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-wrap:wrap">`;
      for (const tag of tagList) {
        body += `<span style="font-size:0.75rem;background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:4px">${escapeHtml(tag)}</span>`;
      }
      body += `</div>`;
    }
  }

  body += `</article>`;

  return renderBaseHtml({ ...opts, title, meta, body, structuredData });
}
