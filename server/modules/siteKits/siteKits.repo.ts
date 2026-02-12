import { db } from "../../db";
import { siteKits, siteKitAssets } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { InsertSiteKit, InsertSiteKitAsset } from "@shared/schema";

class SiteKitsRepo {
  async findAll() {
    return db.select().from(siteKits).orderBy(siteKits.name);
  }

  async findByStatus(status: string) {
    return db.select().from(siteKits).where(eq(siteKits.status, status)).orderBy(siteKits.name);
  }

  async findById(id: string) {
    const [kit] = await db.select().from(siteKits).where(eq(siteKits.id, id));
    return kit ?? null;
  }

  async findBySlug(slug: string) {
    const [kit] = await db.select().from(siteKits).where(eq(siteKits.slug, slug));
    return kit ?? null;
  }

  async create(data: InsertSiteKit) {
    const [kit] = await db.insert(siteKits).values(data).returning();
    return kit;
  }

  async update(id: string, data: Partial<InsertSiteKit>) {
    const [kit] = await db
      .update(siteKits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(siteKits.id, id))
      .returning();
    return kit ?? null;
  }

  async delete(id: string) {
    const [kit] = await db.delete(siteKits).where(eq(siteKits.id, id)).returning();
    return kit ?? null;
  }

  async findAssets(siteKitId: string) {
    return db
      .select()
      .from(siteKitAssets)
      .where(eq(siteKitAssets.siteKitId, siteKitId))
      .orderBy(siteKitAssets.sortOrder);
  }

  async findAssetsByType(siteKitId: string, assetType: string) {
    return db
      .select()
      .from(siteKitAssets)
      .where(and(eq(siteKitAssets.siteKitId, siteKitId), eq(siteKitAssets.assetType, assetType)))
      .orderBy(siteKitAssets.sortOrder);
  }

  async createAsset(data: InsertSiteKitAsset) {
    const [asset] = await db.insert(siteKitAssets).values(data).returning();
    return asset;
  }

  async updateAsset(id: string, data: Partial<InsertSiteKitAsset>) {
    const [asset] = await db
      .update(siteKitAssets)
      .set(data)
      .where(eq(siteKitAssets.id, id))
      .returning();
    return asset ?? null;
  }

  async deleteAsset(id: string) {
    const [asset] = await db.delete(siteKitAssets).where(eq(siteKitAssets.id, id)).returning();
    return asset ?? null;
  }

  async deleteAllAssets(siteKitId: string) {
    return db.delete(siteKitAssets).where(eq(siteKitAssets.siteKitId, siteKitId));
  }
}

export const siteKitsRepo = new SiteKitsRepo();
