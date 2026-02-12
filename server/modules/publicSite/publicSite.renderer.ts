import type { PublishedPage } from "./publicSite.service";

interface RenderOptions {
  site: { name: string; slug: string };
  page: PublishedPage;
  theme?: { tokensJson: unknown; layoutJson: unknown } | null;
  pages: Array<{ slug: string; title: string }>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderContentBlock(block: any): string {
  if (!block || !block.type || !block.props) return "";

  const { type, props } = block;

  switch (type) {
    case "hero": {
      const bgStyle = props.backgroundImage
        ? `background-image:url(${escapeHtml(props.backgroundImage)});background-size:cover;background-position:center`
        : `background:linear-gradient(135deg,hsl(220 60% 15%),hsl(220 60% 25%))`;
      const alignMap: Record<string, string> = { left: "text-align:left", center: "text-align:center", right: "text-align:right" };
      const heightMap: Record<string, string> = { small: "300px", medium: "400px", large: "500px", fullscreen: "80vh" };
      return `<section style="${bgStyle};min-height:${heightMap[props.minHeight] || "500px"};display:flex;flex-direction:column;justify-content:center;align-items:center;padding:64px 24px;position:relative">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
        <div style="position:relative;z-index:1;max-width:900px;${alignMap[props.alignment] || "text-align:center"}">
          <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:700;color:#fff;margin:0 0 16px">${escapeHtml(props.headline || "")}</h1>
          ${props.subheading ? `<p style="font-size:1.25rem;color:rgba(255,255,255,0.8);margin:0 0 24px">${escapeHtml(props.subheading)}</p>` : ""}
          <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:${props.alignment === "left" ? "flex-start" : props.alignment === "right" ? "flex-end" : "center"}">
            ${props.ctaLabel ? `<a href="${escapeHtml(props.ctaHref || "#")}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">${escapeHtml(props.ctaLabel)}</a>` : ""}
            ${props.secondaryCtaLabel ? `<a href="${escapeHtml(props.secondaryCtaHref || "#")}" style="display:inline-block;padding:12px 24px;border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:6px;text-decoration:none;font-weight:500;backdrop-filter:blur(4px)">${escapeHtml(props.secondaryCtaLabel)}</a>` : ""}
          </div>
        </div>
      </section>`;
    }

    case "feature-grid": {
      const features = Array.isArray(props.features) ? props.features : [];
      const cols = props.columns || "3";
      return `<section style="padding:64px 24px;max-width:1200px;margin:0 auto">
        ${props.heading ? `<h2 style="font-size:1.5rem;font-weight:700;text-align:center;margin:0 0 8px">${escapeHtml(props.heading)}</h2>` : ""}
        ${props.subheading ? `<p style="color:#6b7280;text-align:center;margin:0 0 32px">${escapeHtml(props.subheading)}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px">
          ${features.map((f: any) => `<div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px">
            <h3 style="font-size:0.875rem;font-weight:600;margin:0 0 8px">${escapeHtml(f.title || "")}</h3>
            <p style="font-size:0.875rem;color:#6b7280;margin:0">${escapeHtml(f.description || "")}</p>
          </div>`).join("")}
        </div>
      </section>`;
    }

    case "cta": {
      const bgMap: Record<string, string> = {
        default: "background:#f9fafb",
        gradient: "background:linear-gradient(135deg,#2563eb,rgba(37,99,235,0.8));color:#fff",
        outlined: "border:2px solid #2563eb",
      };
      return `<section style="padding:64px 24px;${bgMap[props.variant] || bgMap.gradient}">
        <div style="max-width:900px;margin:0 auto;text-align:${props.alignment || "center"}">
          <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 12px">${escapeHtml(props.headline || "")}</h2>
          ${props.description ? `<p style="margin:0 0 24px;opacity:0.8">${escapeHtml(props.description)}</p>` : ""}
          <a href="${escapeHtml(props.ctaHref || "#")}" style="display:inline-block;padding:12px 24px;background:${props.variant === "gradient" ? "#fff;color:#2563eb" : "#2563eb;color:#fff"};border-radius:6px;text-decoration:none;font-weight:500">${escapeHtml(props.ctaLabel || "")}</a>
        </div>
      </section>`;
    }

    case "rich-text": {
      const widthMap: Record<string, string> = { narrow: "640px", medium: "768px", wide: "1024px", full: "100%" };
      return `<section style="padding:32px 24px">
        <div style="max-width:${widthMap[props.maxWidth] || "768px"};margin:0 auto;text-align:${props.alignment || "left"};white-space:pre-wrap;font-size:0.875rem;line-height:1.6">${escapeHtml(props.content || "")}</div>
      </section>`;
    }

    case "divider": {
      const spacingMap: Record<string, string> = { small: "16px", medium: "32px", large: "48px", xlarge: "64px" };
      const padding = spacingMap[props.spacing] || "32px";
      if (props.variant === "space") return `<div style="padding:${padding} 0"></div>`;
      return `<div style="padding:${padding} 0"><hr style="border:0;border-top:1px ${props.variant === "dashed" ? "dashed" : props.variant === "dotted" ? "dotted" : "solid"} #e5e7eb;margin:0 auto;width:${props.width === "half" ? "50%" : props.width === "third" ? "33%" : "100%"}"></div>`;
    }

    case "spacer": {
      const hMap: Record<string, string> = { xs: "8px", sm: "16px", md: "32px", lg: "48px", xl: "64px", "2xl": "96px" };
      return `<div style="height:${hMap[props.height] || "32px"}" aria-hidden="true"></div>`;
    }

    case "testimonials": {
      const items = Array.isArray(props.testimonials) ? props.testimonials : [];
      return `<section style="padding:64px 24px;max-width:1200px;margin:0 auto">
        ${props.heading ? `<h2 style="font-size:1.5rem;font-weight:700;text-align:center;margin:0 0 32px">${escapeHtml(props.heading)}</h2>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${props.columns || 3},1fr);gap:24px">
          ${items.map((t: any) => `<div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px">
            <p style="font-style:italic;color:#6b7280;margin:0 0 12px">"${escapeHtml(t.quote || "")}"</p>
            <div><strong style="font-size:0.875rem">${escapeHtml(t.name || "")}</strong>${t.role ? `<br><span style="font-size:0.75rem;color:#6b7280">${escapeHtml(t.role)}</span>` : ""}</div>
          </div>`).join("")}
        </div>
      </section>`;
    }

    case "pricing": {
      const plans = Array.isArray(props.plans) ? props.plans : [];
      return `<section style="padding:64px 24px;max-width:1200px;margin:0 auto">
        ${props.heading ? `<h2 style="font-size:1.5rem;font-weight:700;text-align:center;margin:0 0 32px">${escapeHtml(props.heading)}</h2>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${Math.min(plans.length, 3)},1fr);gap:24px">
          ${plans.map((p: any) => `<div style="padding:24px;border:1px solid #e5e7eb;border-radius:8px;${p.name === props.highlightPlan ? "border-color:#2563eb;border-width:2px" : ""}">
            <h3 style="font-size:1.125rem;font-weight:600;margin:0 0 8px">${escapeHtml(p.name || "")}</h3>
            <div style="font-size:2rem;font-weight:700;margin:0 0 16px">$${p.monthlyPrice || 0}<span style="font-size:0.875rem;font-weight:400;color:#6b7280">/mo</span></div>
            <ul style="list-style:none;padding:0;margin:0 0 16px">${(p.features || []).map((f: string) => `<li style="font-size:0.875rem;color:#6b7280;padding:4px 0">${escapeHtml(f)}</li>`).join("")}</ul>
          </div>`).join("")}
        </div>
      </section>`;
    }

    case "gallery": {
      const images = Array.isArray(props.images) ? props.images : [];
      return `<section style="padding:64px 24px;max-width:1200px;margin:0 auto">
        ${props.heading ? `<h2 style="font-size:1.5rem;font-weight:700;text-align:center;margin:0 0 32px">${escapeHtml(props.heading)}</h2>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${props.columns || 3},1fr);gap:16px">
          ${images.map((img: any) => `<div style="overflow:hidden;border-radius:8px;background:#f3f4f6;aspect-ratio:16/9">
            ${img.src ? `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || "")}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:0.875rem">Image</div>`}
          </div>`).join("")}
        </div>
      </section>`;
    }

    case "faq": {
      const faqItems = Array.isArray(props.items) ? props.items : [];
      return `<section style="padding:64px 24px;max-width:768px;margin:0 auto">
        ${props.heading ? `<h2 style="font-size:1.5rem;font-weight:700;text-align:center;margin:0 0 32px">${escapeHtml(props.heading)}</h2>` : ""}
        ${faqItems.map((item: any) => `<details style="border:1px solid #e5e7eb;border-radius:6px;margin:0 0 8px;overflow:hidden">
          <summary style="padding:12px 16px;font-size:0.875rem;font-weight:500;cursor:pointer">${escapeHtml(item.question || "")}</summary>
          <div style="padding:0 16px 12px;font-size:0.875rem;color:#6b7280">${escapeHtml(item.answer || "")}</div>
        </details>`).join("")}
      </section>`;
    }

    default:
      return "";
  }
}

export function renderPublicPage(opts: RenderOptions): string {
  const { site, page, pages: sitePages } = opts;
  const title = page.seoTitle || page.title;
  const description = page.seoDescription || "";

  let contentHtml = "";
  const contentJson = page.contentJson as any;
  if (contentJson && contentJson.schemaVersion && contentJson.data && Array.isArray(contentJson.data.content)) {
    contentHtml = contentJson.data.content.map(renderContentBlock).join("\n");
  } else if (contentJson && typeof contentJson === "object") {
    contentHtml = `<section style="padding:64px 24px;max-width:768px;margin:0 auto"><pre style="white-space:pre-wrap;font-size:0.875rem">${escapeHtml(JSON.stringify(contentJson, null, 2))}</pre></section>`;
  }

  const nav = sitePages.length > 1
    ? `<nav style="background:#fff;border-bottom:1px solid #e5e7eb;padding:0 24px">
        <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:24px;height:56px">
          <strong style="font-size:0.875rem">${escapeHtml(site.name)}</strong>
          <div style="display:flex;gap:16px;margin-left:auto">
            ${sitePages.map((p) => `<a href="/${p.slug}" style="font-size:0.875rem;text-decoration:none;color:${p.slug === page.slug ? "#2563eb" : "#6b7280"};font-weight:${p.slug === page.slug ? "600" : "400"}">${escapeHtml(p.title)}</a>`).join("")}
          </div>
        </div>
      </nav>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | ${escapeHtml(site.name)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ""}
  <meta property="og:title" content="${escapeHtml(title)}">
  ${description ? `<meta property="og:description" content="${escapeHtml(description)}">` : ""}
  ${page.seoImage ? `<meta property="og:image" content="${escapeHtml(page.seoImage)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.5; -webkit-font-smoothing: antialiased; }
    img { max-width: 100%; height: auto; }
    @media (max-width: 768px) {
      [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
      [style*="grid-template-columns:repeat(3"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
    }
  </style>
</head>
<body>
  ${nav}
  <main>
    ${contentHtml || `<div style="padding:96px 24px;text-align:center;color:#9ca3af">This page has no content yet.</div>`}
  </main>
  <footer style="border-top:1px solid #e5e7eb;padding:24px;text-align:center;font-size:0.75rem;color:#9ca3af">
    Powered by ORIGIN
  </footer>
</body>
</html>`;
}

export function render404Page(siteName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | ${escapeHtml(siteName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #374151; }
    .c { text-align: center; }
    h1 { font-size: 4rem; font-weight: 700; margin: 0 0 8px; color: #d1d5db; }
    p { margin: 0 0 24px; color: #6b7280; }
    a { color: #2563eb; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="c">
    <h1>404</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go to homepage</a>
  </div>
</body>
</html>`;
}
