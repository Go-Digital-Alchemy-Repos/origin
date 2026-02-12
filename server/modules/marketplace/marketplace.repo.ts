import { db } from "../../db";
import { marketplaceItems, marketplaceInstalls, previewSessions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { InsertMarketplaceItem, InsertMarketplaceInstall, InsertPreviewSession } from "@shared/schema";

class MarketplaceRepo {
  async findAllItems() {
    return db.select().from(marketplaceItems).orderBy(marketplaceItems.name);
  }

  async findItemsByType(type: string) {
    return db.select().from(marketplaceItems).where(eq(marketplaceItems.type, type)).orderBy(marketplaceItems.name);
  }

  async findPublishedItems() {
    return db.select().from(marketplaceItems).where(eq(marketplaceItems.status, "published")).orderBy(marketplaceItems.name);
  }

  async findPublishedItemsByType(type: string) {
    return db
      .select()
      .from(marketplaceItems)
      .where(and(eq(marketplaceItems.type, type), eq(marketplaceItems.status, "published")))
      .orderBy(marketplaceItems.name);
  }

  async findItemBySlug(slug: string) {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.slug, slug));
    return item ?? null;
  }

  async findItemById(id: string) {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return item ?? null;
  }

  async createItem(data: InsertMarketplaceItem) {
    const [item] = await db.insert(marketplaceItems).values(data).returning();
    return item;
  }

  async updateItem(id: string, data: Partial<InsertMarketplaceItem>) {
    const [item] = await db
      .update(marketplaceItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketplaceItems.id, id))
      .returning();
    return item ?? null;
  }

  async deleteItem(id: string) {
    const [item] = await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id)).returning();
    return item ?? null;
  }

  async findInstallsByWorkspace(workspaceId: string) {
    return db.select().from(marketplaceInstalls).where(eq(marketplaceInstalls.workspaceId, workspaceId));
  }

  async findInstall(workspaceId: string, itemId: string) {
    const [install] = await db
      .select()
      .from(marketplaceInstalls)
      .where(and(eq(marketplaceInstalls.workspaceId, workspaceId), eq(marketplaceInstalls.itemId, itemId)));
    return install ?? null;
  }

  async createInstall(data: InsertMarketplaceInstall) {
    const [install] = await db.insert(marketplaceInstalls).values(data).returning();
    return install;
  }

  async updateInstall(id: string, data: Partial<InsertMarketplaceInstall>) {
    const [install] = await db
      .update(marketplaceInstalls)
      .set(data)
      .where(eq(marketplaceInstalls.id, id))
      .returning();
    return install ?? null;
  }

  async deleteInstall(id: string) {
    const [install] = await db.delete(marketplaceInstalls).where(eq(marketplaceInstalls.id, id)).returning();
    return install ?? null;
  }

  async createPreviewSession(data: InsertPreviewSession) {
    const [session] = await db.insert(previewSessions).values(data).returning();
    return session;
  }

  async findPreviewSession(workspaceId: string, itemId: string) {
    const [session] = await db
      .select()
      .from(previewSessions)
      .where(and(eq(previewSessions.workspaceId, workspaceId), eq(previewSessions.itemId, itemId)));
    return session ?? null;
  }

  async deletePreviewSession(id: string) {
    const [session] = await db.delete(previewSessions).where(eq(previewSessions.id, id)).returning();
    return session ?? null;
  }
}

export const marketplaceRepo = new MarketplaceRepo();
