import { db } from "../../db";
import { siteThemes, sites, themeTokensSchema, layoutPresetsSchema } from "@shared/schema";
import type { SiteTheme, ThemeTokens, LayoutPresets } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_TOKENS: ThemeTokens = {
  light: {
    surface: "#ffffff",
    surfaceAlt: "#f8f9fa",
    text: "#1a1a2e",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    accent: "#2563eb",
    accentText: "#ffffff",
  },
  dark: {
    surface: "#1a1a2e",
    surfaceAlt: "#16213e",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#334155",
    accent: "#3b82f6",
    accentText: "#ffffff",
  },
  fontHeading: "Inter",
  fontBody: "Inter",
  borderRadius: "md",
};

const DEFAULT_LAYOUT: LayoutPresets = {
  headerStyle: "standard",
  footerStyle: "standard",
  sectionSpacing: "comfortable",
  containerWidth: "standard",
  buttonStyle: "rounded",
};

async function verifySiteOwnership(siteId: string, workspaceId: string): Promise<boolean> {
  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.workspaceId, workspaceId)));
  return !!site;
}

async function getThemeBySite(siteId: string): Promise<SiteTheme | null> {
  const [theme] = await db
    .select()
    .from(siteThemes)
    .where(eq(siteThemes.siteId, siteId));
  return theme ?? null;
}

async function getOrCreateTheme(siteId: string): Promise<{ tokens: ThemeTokens; layout: LayoutPresets; id: string }> {
  let theme = await getThemeBySite(siteId);
  if (!theme) {
    const [created] = await db
      .insert(siteThemes)
      .values({
        siteId,
        tokensJson: DEFAULT_TOKENS,
        layoutJson: DEFAULT_LAYOUT,
      })
      .returning();
    theme = created;
  }

  const tokens = themeTokensSchema.parse(
    typeof theme.tokensJson === "object" && theme.tokensJson && Object.keys(theme.tokensJson).length > 0
      ? theme.tokensJson
      : DEFAULT_TOKENS,
  );
  const layout = layoutPresetsSchema.parse(
    typeof theme.layoutJson === "object" && theme.layoutJson && Object.keys(theme.layoutJson).length > 0
      ? theme.layoutJson
      : DEFAULT_LAYOUT,
  );

  return { tokens, layout, id: theme.id };
}

async function updateTokens(siteId: string, tokens: ThemeTokens): Promise<SiteTheme> {
  const existing = await getThemeBySite(siteId);
  if (existing) {
    const [updated] = await db
      .update(siteThemes)
      .set({ tokensJson: tokens, updatedAt: new Date() })
      .where(eq(siteThemes.siteId, siteId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(siteThemes)
    .values({ siteId, tokensJson: tokens, layoutJson: DEFAULT_LAYOUT })
    .returning();
  return created;
}

async function updateLayout(siteId: string, layout: LayoutPresets): Promise<SiteTheme> {
  const existing = await getThemeBySite(siteId);
  if (existing) {
    const [updated] = await db
      .update(siteThemes)
      .set({ layoutJson: layout, updatedAt: new Date() })
      .where(eq(siteThemes.siteId, siteId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(siteThemes)
    .values({ siteId, tokensJson: DEFAULT_TOKENS, layoutJson: layout })
    .returning();
  return created;
}

async function updateTheme(
  siteId: string,
  tokens: ThemeTokens,
  layout: LayoutPresets,
): Promise<SiteTheme> {
  const existing = await getThemeBySite(siteId);
  if (existing) {
    const [updated] = await db
      .update(siteThemes)
      .set({ tokensJson: tokens, layoutJson: layout, updatedAt: new Date() })
      .where(eq(siteThemes.siteId, siteId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(siteThemes)
    .values({ siteId, tokensJson: tokens, layoutJson: layout })
    .returning();
  return created;
}

export const siteThemeService = {
  verifySiteOwnership,
  getOrCreateTheme,
  updateTokens,
  updateLayout,
  updateTheme,
  DEFAULT_TOKENS,
  DEFAULT_LAYOUT,
};
