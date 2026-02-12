import { db } from "../../db";
import { redirects, redirectSuggestions, sites } from "@shared/schema";
import type { Redirect, RedirectSuggestion } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const redirectsService = {
  async verifySiteOwnership(siteId: string, workspaceId: string): Promise<boolean> {
    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.workspaceId, workspaceId)));
    return !!site;
  },

  async verifyRedirectOwnership(redirectId: string, workspaceId: string): Promise<Redirect | null> {
    const [redirect] = await db
      .select({ redirect: redirects })
      .from(redirects)
      .innerJoin(sites, eq(redirects.siteId, sites.id))
      .where(and(eq(redirects.id, redirectId), eq(sites.workspaceId, workspaceId)));
    return redirect?.redirect ?? null;
  },

  async verifySuggestionOwnership(suggestionId: string, workspaceId: string): Promise<RedirectSuggestion | null> {
    const [suggestion] = await db
      .select({ suggestion: redirectSuggestions })
      .from(redirectSuggestions)
      .innerJoin(sites, eq(redirectSuggestions.siteId, sites.id))
      .where(and(eq(redirectSuggestions.id, suggestionId), eq(sites.workspaceId, workspaceId)));
    return suggestion?.suggestion ?? null;
  },

  async getRedirectsBySite(siteId: string): Promise<Redirect[]> {
    return db
      .select()
      .from(redirects)
      .where(eq(redirects.siteId, siteId))
      .orderBy(desc(redirects.createdAt));
  },

  async getRedirect(id: string): Promise<Redirect | undefined> {
    const [redirect] = await db.select().from(redirects).where(eq(redirects.id, id));
    return redirect ?? undefined;
  },

  async findRedirectByPath(siteId: string, fromPath: string): Promise<Redirect | undefined> {
    const normalized = normalizePath(fromPath);
    const [redirect] = await db
      .select()
      .from(redirects)
      .where(and(eq(redirects.siteId, siteId), eq(redirects.fromPath, normalized)))
      .limit(1);
    return redirect ?? undefined;
  },

  async createRedirect(data: {
    siteId: string;
    fromPath: string;
    toUrl: string;
    code?: number;
  }): Promise<Redirect> {
    const [redirect] = await db
      .insert(redirects)
      .values({
        siteId: data.siteId,
        fromPath: normalizePath(data.fromPath),
        toUrl: data.toUrl,
        code: data.code ?? 301,
      })
      .returning();
    return redirect;
  },

  async updateRedirect(
    id: string,
    data: { fromPath?: string; toUrl?: string; code?: number },
  ): Promise<Redirect> {
    const updateFields: Record<string, unknown> = {};
    if (data.fromPath !== undefined) updateFields.fromPath = normalizePath(data.fromPath);
    if (data.toUrl !== undefined) updateFields.toUrl = data.toUrl;
    if (data.code !== undefined) updateFields.code = data.code;

    const [redirect] = await db
      .update(redirects)
      .set(updateFields)
      .where(eq(redirects.id, id))
      .returning();
    return redirect;
  },

  async deleteRedirect(id: string): Promise<void> {
    await db.delete(redirects).where(eq(redirects.id, id));
  },

  async bulkCreateRedirects(
    siteId: string,
    rows: Array<{ fromPath: string; toUrl: string; code?: number }>,
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const normalized = normalizePath(row.fromPath);
      const existing = await this.findRedirectByPath(siteId, normalized);
      if (existing) {
        skipped++;
        continue;
      }
      await db.insert(redirects).values({
        siteId,
        fromPath: normalized,
        toUrl: row.toUrl,
        code: row.code ?? 301,
      });
      created++;
    }

    return { created, skipped };
  },

  async getSuggestionsBySite(siteId: string): Promise<RedirectSuggestion[]> {
    return db
      .select()
      .from(redirectSuggestions)
      .where(eq(redirectSuggestions.siteId, siteId))
      .orderBy(desc(redirectSuggestions.createdAt));
  },

  async acceptSuggestion(suggestionId: string): Promise<Redirect | null> {
    const [suggestion] = await db
      .select()
      .from(redirectSuggestions)
      .where(eq(redirectSuggestions.id, suggestionId));
    if (!suggestion) return null;

    const existing = await this.findRedirectByPath(suggestion.siteId, suggestion.fromPath);
    if (existing) {
      await db.delete(redirectSuggestions).where(eq(redirectSuggestions.id, suggestionId));
      return existing;
    }

    const redirect = await this.createRedirect({
      siteId: suggestion.siteId,
      fromPath: suggestion.fromPath,
      toUrl: suggestion.toUrl,
      code: 301,
    });

    await db.delete(redirectSuggestions).where(eq(redirectSuggestions.id, suggestionId));
    return redirect;
  },

  async dismissSuggestion(suggestionId: string): Promise<void> {
    await db.delete(redirectSuggestions).where(eq(redirectSuggestions.id, suggestionId));
  },

  async getRedirectCount(siteId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(redirects)
      .where(eq(redirects.siteId, siteId));
    return result?.count ?? 0;
  },
};

function normalizePath(path: string): string {
  let p = path.trim();
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+$/, "") || "/";
  return p;
}
