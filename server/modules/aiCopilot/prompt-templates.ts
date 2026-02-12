import type { WorkspaceContext } from "./context-builder";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  contextInjection: (ctx: WorkspaceContext) => string;
}

function formatSiteSummary(ctx: WorkspaceContext): string {
  if (ctx.sites.length === 0) return "No sites configured yet.";
  return ctx.sites
    .map(
      (s) =>
        `- Site "${s.name}" (${s.slug}, ${s.status}): ${s.pageCount} page(s)` +
        (s.pages.length > 0
          ? "\n  Pages: " + s.pages.map((p) => `${p.title} [${p.status}]`).join(", ")
          : ""),
    )
    .join("\n");
}

function formatInstalledApps(ctx: WorkspaceContext): string {
  if (ctx.installedApps.length === 0) return "No marketplace apps installed.";
  return ctx.installedApps
    .map((a) => `- ${a.name} (${a.type}, ${a.enabled ? "active" : "disabled"})`)
    .join("\n");
}

function formatCapabilities(ctx: WorkspaceContext): string {
  if (ctx.capabilities.length === 0) return "Basic plan features only.";
  return ctx.capabilities.join(", ");
}

function formatCollections(ctx: WorkspaceContext): string {
  if (ctx.collections.length === 0) return "No collections defined.";
  return ctx.collections.map((c) => `- ${c.name} (${c.slug})`).join("\n");
}

function formatMenus(ctx: WorkspaceContext): string {
  if (ctx.menus.length === 0) return "No navigation menus configured.";
  return ctx.menus.map((m) => `- ${m.name}${m.slot ? ` [${m.slot}]` : ""}`).join("\n");
}

function buildFullContext(ctx: WorkspaceContext): string {
  return [
    "## Workspace Context",
    "",
    `**Features:** ${formatCapabilities(ctx)}`,
    `**Limits:** ${JSON.stringify(ctx.workspace.limits)}`,
    "",
    "### Installed Apps",
    formatInstalledApps(ctx),
    "",
    "### Sites & Pages",
    formatSiteSummary(ctx),
    "",
    "### Collections",
    formatCollections(ctx),
    "",
    "### Navigation Menus",
    formatMenus(ctx),
  ].join("\n");
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "general-assistant",
    name: "General Assistant",
    description: "A general-purpose copilot that understands the full workspace context.",
    systemPrompt: [
      "You are ORIGIN Copilot, an AI assistant for the ORIGIN website platform.",
      "You help users manage their websites, content, and business tools.",
      "Always give actionable, specific suggestions based on the workspace context provided.",
      "Refer to features by their ORIGIN names (Pages, Collections, Marketplace, etc.).",
      "If a feature is not available in the workspace, suggest how to enable it.",
      "Keep responses concise and practical.",
    ].join(" "),
    contextInjection: buildFullContext,
  },
  {
    id: "content-strategy",
    name: "Content Strategy",
    description: "Helps plan content strategy based on existing pages and collections.",
    systemPrompt: [
      "You are ORIGIN Content Strategist, an AI that helps plan and optimize website content.",
      "Analyze existing pages, their status, and suggest improvements.",
      "Recommend new pages, blog posts, or collection items based on gaps in content coverage.",
      "Consider SEO best practices when making suggestions.",
      "If the workspace has blog capabilities, suggest blog content ideas.",
    ].join(" "),
    contextInjection: (ctx) => {
      const parts = [
        "## Content Context",
        "",
        "### Sites & Pages",
        formatSiteSummary(ctx),
        "",
        "### Collections",
        formatCollections(ctx),
        "",
        `**Has Blog:** ${ctx.capabilities.includes("blog") ? "Yes" : "No"}`,
        `**Has SEO:** ${ctx.capabilities.includes("seo") ? "Yes" : "No"}`,
      ];
      return parts.join("\n");
    },
  },
  {
    id: "lead-capture",
    name: "Lead Capture & CRM",
    description: "Suggests lead capture flows when CRM is enabled.",
    systemPrompt: [
      "You are ORIGIN Lead Capture Advisor, an AI that helps design lead generation strategies.",
      "Suggest form placements, landing page designs, and CRM workflows.",
      "If the workspace has CRM enabled, recommend lead capture forms on high-traffic pages.",
      "Suggest email follow-up sequences and lead scoring approaches.",
      "If CRM is not enabled, explain how installing the CRM Suite from the Marketplace would help.",
    ].join(" "),
    contextInjection: (ctx) => {
      const hasCrm = ctx.capabilities.includes("crm");
      const hasForms = ctx.capabilities.includes("forms");
      const parts = [
        "## Lead Capture Context",
        "",
        `**CRM Enabled:** ${hasCrm ? "Yes — lead and contact management available" : "No — suggest installing CRM Suite from Marketplace"}`,
        `**Forms Enabled:** ${hasForms ? "Yes — form builder available for lead capture" : "No — suggest enabling forms"}`,
        "",
        "### Sites & Pages (potential lead capture locations)",
        formatSiteSummary(ctx),
        "",
        "### Installed Apps",
        formatInstalledApps(ctx),
      ];
      return parts.join("\n");
    },
  },
  {
    id: "site-optimization",
    name: "Site Optimization",
    description: "Analyzes site structure and suggests improvements.",
    systemPrompt: [
      "You are ORIGIN Site Optimizer, an AI that improves website performance and user experience.",
      "Analyze the site structure, pages, menus, and collections.",
      "Suggest improvements to navigation, page organization, and content hierarchy.",
      "Recommend SEO improvements if available.",
      "Suggest appropriate marketplace items that could enhance the site.",
    ].join(" "),
    contextInjection: (ctx) => {
      const parts = [
        "## Site Optimization Context",
        "",
        "### Sites & Pages",
        formatSiteSummary(ctx),
        "",
        "### Navigation Menus",
        formatMenus(ctx),
        "",
        "### Collections",
        formatCollections(ctx),
        "",
        "### Available Capabilities",
        formatCapabilities(ctx),
      ];
      return parts.join("\n");
    },
  },
];

export function getTemplate(templateId: string): PromptTemplate | undefined {
  return promptTemplates.find((t) => t.id === templateId);
}

export function buildPrompt(template: PromptTemplate, ctx: WorkspaceContext, userMessage: string): {
  systemMessage: string;
  userMessage: string;
} {
  const contextBlock = template.contextInjection(ctx);
  return {
    systemMessage: `${template.systemPrompt}\n\n${contextBlock}`,
    userMessage,
  };
}
