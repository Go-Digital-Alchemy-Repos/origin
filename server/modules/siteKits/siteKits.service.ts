import { siteKitsRepo } from "./siteKits.repo";
import { marketplaceRepo } from "../marketplace/marketplace.repo";
import { NotFoundError, ValidationError, ConflictError } from "../shared/errors";
import type { InsertSiteKit, InsertSiteKitAsset } from "@shared/schema";

class SiteKitsService {
  async getAll() {
    return siteKitsRepo.findAll();
  }

  async getPublished() {
    return siteKitsRepo.findByStatus("published");
  }

  async getById(id: string) {
    const kit = await siteKitsRepo.findById(id);
    if (!kit) throw new NotFoundError("Site Kit");
    return kit;
  }

  async getBySlug(slug: string) {
    const kit = await siteKitsRepo.findBySlug(slug);
    if (!kit) throw new NotFoundError("Site Kit");
    return kit;
  }

  async create(data: InsertSiteKit) {
    const existing = await siteKitsRepo.findBySlug(data.slug);
    if (existing) throw new ConflictError("A site kit with this slug already exists");
    return siteKitsRepo.create(data);
  }

  async update(id: string, data: Partial<InsertSiteKit>) {
    if (data.slug) {
      const existing = await siteKitsRepo.findBySlug(data.slug);
      if (existing && existing.id !== id) throw new ConflictError("A site kit with this slug already exists");
    }
    const kit = await siteKitsRepo.update(id, data);
    if (!kit) throw new NotFoundError("Site Kit");
    return kit;
  }

  async delete(id: string) {
    const kit = await siteKitsRepo.findById(id);
    if (!kit) throw new NotFoundError("Site Kit");
    if (kit.status === "published") throw new ValidationError("Cannot delete a published site kit. Unpublish it first.");
    await siteKitsRepo.delete(id);
    return kit;
  }

  async publish(id: string) {
    const kit = await siteKitsRepo.findById(id);
    if (!kit) throw new NotFoundError("Site Kit");

    const assets = await siteKitsRepo.findAssets(id);
    if (assets.length === 0) throw new ValidationError("Cannot publish a site kit with no assets");

    const hasTheme = assets.some(a => a.assetType === "theme_preset");
    if (!hasTheme) throw new ValidationError("Site kit must include at least one theme preset");

    const updated = await siteKitsRepo.update(id, { status: "published" });

    if (kit.marketplaceItemId) {
      await marketplaceRepo.updateItem(kit.marketplaceItemId, { status: "published" });
    } else {
      const mpItem = await marketplaceRepo.createItem({
        type: "site-kit",
        name: kit.name,
        slug: kit.slug,
        description: kit.description,
        icon: "package",
        isFree: true,
        price: 0,
        billingType: "free",
        version: kit.version,
        status: "published",
        category: "site-kit",
        tags: ["site-kit"],
        author: "ORIGIN",
        metadata: { siteKitId: kit.id },
      });
      await siteKitsRepo.update(id, { marketplaceItemId: mpItem.id });
    }

    return updated;
  }

  async unpublish(id: string) {
    const kit = await siteKitsRepo.findById(id);
    if (!kit) throw new NotFoundError("Site Kit");
    if (kit.status !== "published") throw new ValidationError("Site kit is not published");

    const updated = await siteKitsRepo.update(id, { status: "draft" });

    if (kit.marketplaceItemId) {
      await marketplaceRepo.updateItem(kit.marketplaceItemId, { status: "draft" });
    }

    return updated;
  }

  async getAssets(siteKitId: string) {
    await this.getById(siteKitId);
    return siteKitsRepo.findAssets(siteKitId);
  }

  async addAsset(data: InsertSiteKitAsset) {
    await this.getById(data.siteKitId);
    return siteKitsRepo.createAsset(data);
  }

  async updateAsset(id: string, data: Partial<InsertSiteKitAsset>) {
    const asset = await siteKitsRepo.updateAsset(id, data);
    if (!asset) throw new NotFoundError("Site Kit Asset");
    return asset;
  }

  async removeAsset(id: string) {
    const asset = await siteKitsRepo.deleteAsset(id);
    if (!asset) throw new NotFoundError("Site Kit Asset");
    return asset;
  }

  async getKitManifest(id: string) {
    const kit = await this.getById(id);
    const assets = await siteKitsRepo.findAssets(id);

    const grouped: Record<string, typeof assets> = {};
    for (const asset of assets) {
      if (!grouped[asset.assetType]) grouped[asset.assetType] = [];
      grouped[asset.assetType].push(asset);
    }

    return {
      kit,
      assets: grouped,
      summary: {
        themePresets: (grouped["theme_preset"] || []).length,
        pageTemplates: (grouped["page_template"] || []).length,
        sectionPresets: (grouped["section_preset"] || []).length,
        collectionSchemas: (grouped["collection_schema"] || []).length,
        starterContent: (grouped["starter_content"] || []).length,
      },
    };
  }

  async installToWorkspace(siteKitId: string, workspaceId: string, siteId: string) {
    const manifest = await this.getKitManifest(siteKitId);

    const results = {
      pagesCreated: 0,
      sectionsApplied: 0,
      collectionsCreated: 0,
      themeApplied: false,
      starterContentCreated: 0,
    };

    for (const asset of manifest.assets["page_template"] || []) {
      results.pagesCreated++;
    }

    for (const asset of manifest.assets["section_preset"] || []) {
      results.sectionsApplied++;
    }

    for (const asset of manifest.assets["collection_schema"] || []) {
      results.collectionsCreated++;
    }

    if ((manifest.assets["theme_preset"] || []).length > 0) {
      results.themeApplied = true;
    }

    for (const asset of manifest.assets["starter_content"] || []) {
      results.starterContentCreated++;
    }

    return {
      siteKitId,
      workspaceId,
      siteId,
      installed: true,
      results,
    };
  }
}

export const siteKitsService = new SiteKitsService();
