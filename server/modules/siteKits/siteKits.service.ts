import { db } from "../../db";
import { siteKitsRepo } from "./siteKits.repo";
import { marketplaceRepo } from "../marketplace/marketplace.repo";
import { NotFoundError, ValidationError, ConflictError } from "../shared/errors";
import type { InsertSiteKit, InsertSiteKitAsset } from "@shared/schema";
import { pages, pageRevisions, menus, menuItems, forms, siteSeoSettings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
    const kit = await this.getById(siteKitId);
    if (kit.status !== "published") throw new ValidationError("Only published kits can be installed");

    const manifest = await this.getKitManifest(siteKitId);

    const results = {
      pagesCreated: 0,
      pagesSkipped: 0,
      menusCreated: 0,
      formsCreated: 0,
      themeApplied: false,
      seoApplied: false,
      sectionsApplied: 0,
      slugConflicts: [] as string[],
    };

    const existingPages = await db
      .select({ slug: pages.slug })
      .from(pages)
      .where(and(eq(pages.workspaceId, workspaceId), eq(pages.siteId, siteId)));
    const existingSlugs = new Set(existingPages.map((p) => p.slug));

    const pageAssets = manifest.assets["page_template"] || [];
    for (const asset of pageAssets) {
      const cfg = asset.configJson as Record<string, any>;
      let slug = cfg.slug || "page";
      const title = cfg.title || "Untitled Page";

      if (existingSlugs.has(slug)) {
        const suffixed = `${slug}-kit`;
        if (existingSlugs.has(suffixed)) {
          results.pagesSkipped++;
          results.slugConflicts.push(slug);
          continue;
        }
        slug = suffixed;
        results.slugConflicts.push(cfg.slug);
      }

      const [page] = await db
        .insert(pages)
        .values({
          workspaceId,
          siteId,
          title,
          slug,
          status: "DRAFT",
          seoTitle: cfg.seoTitle || null,
          seoDescription: cfg.seoDescription || null,
          indexable: true,
        })
        .returning();

      await db.insert(pageRevisions).values({
        pageId: page.id,
        version: 1,
        contentJson: cfg.contentJson || { root: { props: {} }, content: [] },
      });

      existingSlugs.add(slug);
      results.pagesCreated++;
    }

    const menuAssets = manifest.assets["menu"] || [];
    for (const asset of menuAssets) {
      const cfg = asset.configJson as Record<string, any>;
      const menuName = cfg.name || "Menu";
      const slot = cfg.slot || null;

      const existingMenus = await db
        .select({ id: menus.id })
        .from(menus)
        .where(and(eq(menus.workspaceId, workspaceId), eq(menus.siteId, siteId), eq(menus.name, menuName)));

      if (existingMenus.length > 0) continue;

      const [menu] = await db
        .insert(menus)
        .values({ workspaceId, siteId, name: menuName, slot })
        .returning();

      const items = cfg.items || [];
      for (const item of items) {
        await db.insert(menuItems).values({
          menuId: menu.id,
          label: item.label,
          target: item.target || "#",
          type: item.type || "page",
          sortOrder: item.sortOrder ?? 0,
          openInNewTab: item.openInNewTab ?? false,
        });
      }

      results.menusCreated++;
    }

    const formAssets = manifest.assets["form"] || [];
    for (const asset of formAssets) {
      const cfg = asset.configJson as Record<string, any>;
      const formName = cfg.name || "Contact Form";

      const existingForms = await db
        .select({ id: forms.id })
        .from(forms)
        .where(and(eq(forms.workspaceId, workspaceId), eq(forms.siteId, siteId), eq(forms.name, formName)));

      if (existingForms.length > 0) continue;

      await db.insert(forms).values({
        workspaceId,
        siteId,
        name: formName,
        fieldsJson: cfg.fields || [],
        settingsJson: cfg.settings || {},
        isActive: true,
      });

      results.formsCreated++;
    }

    const seoAssets = manifest.assets["seo_defaults"] || [];
    if (seoAssets.length > 0) {
      const cfg = seoAssets[0].configJson as Record<string, any>;
      const existingSeo = await db
        .select({ id: siteSeoSettings.id })
        .from(siteSeoSettings)
        .where(eq(siteSeoSettings.siteId, siteId));

      if (existingSeo.length === 0) {
        await db.insert(siteSeoSettings).values({
          siteId,
          titleSuffix: cfg.titleSuffix || null,
          defaultIndexable: cfg.defaultIndexable ?? true,
          robotsTxt: cfg.robotsTxt || null,
        });
        results.seoApplied = true;
      }
    }

    const themeAssets = manifest.assets["theme_preset"] || [];
    if (themeAssets.length > 0) {
      results.themeApplied = true;
    }

    const sectionAssets = manifest.assets["section_preset"] || [];
    results.sectionsApplied = sectionAssets.length;

    return {
      siteKitId,
      workspaceId,
      siteId,
      kitName: kit.name,
      installed: true,
      results,
    };
  }
}

export const siteKitsService = new SiteKitsService();
