import { marketplaceRepo } from "./marketplace.repo";
import { NotFoundError, ValidationError } from "../shared/errors";
import type { InsertMarketplaceItem, InsertMarketplaceInstall } from "@shared/schema";

class MarketplaceService {
  async getAllItems() {
    return marketplaceRepo.findPublishedItems();
  }

  async getItemsByType(type: string) {
    return marketplaceRepo.findPublishedItemsByType(type);
  }

  async getAllItemsAdmin() {
    return marketplaceRepo.findAllItems();
  }

  async getItemBySlug(slug: string) {
    const item = await marketplaceRepo.findItemBySlug(slug);
    if (!item) throw new NotFoundError("Marketplace item");
    return item;
  }

  async getItemById(id: string) {
    const item = await marketplaceRepo.findItemById(id);
    if (!item) throw new NotFoundError("Marketplace item");
    return item;
  }

  async createItem(data: InsertMarketplaceItem) {
    return marketplaceRepo.createItem(data);
  }

  async updateItem(id: string, data: Partial<InsertMarketplaceItem>) {
    const item = await marketplaceRepo.updateItem(id, data);
    if (!item) throw new NotFoundError("Marketplace item");
    return item;
  }

  async deleteItem(id: string) {
    const item = await marketplaceRepo.deleteItem(id);
    if (!item) throw new NotFoundError("Marketplace item");
    return item;
  }

  async getInstallsByWorkspace(workspaceId: string) {
    return marketplaceRepo.findInstallsByWorkspace(workspaceId);
  }

  async getPurchasesByWorkspace(workspaceId: string) {
    return marketplaceRepo.findPurchasesByWorkspace(workspaceId);
  }

  async getPurchase(workspaceId: string, itemId: string) {
    return marketplaceRepo.findPurchase(workspaceId, itemId);
  }

  async installItem(workspaceId: string, itemId: string) {
    const existing = await marketplaceRepo.findInstall(workspaceId, itemId);
    if (existing) {
      if (existing.enabled) throw new ValidationError("Item already installed");
      return marketplaceRepo.updateInstall(existing.id, { enabled: true });
    }

    const item = await marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError("Marketplace item");

    if (item.billingType !== "free" && !item.isFree) {
      const purchase = await marketplaceRepo.findPurchase(workspaceId, itemId);
      if (!purchase) {
        throw new ValidationError("Purchase required before installing this item");
      }
    }

    return marketplaceRepo.createInstall({
      workspaceId,
      itemId,
      enabled: true,
      purchased: item.isFree || item.billingType === "free",
    });
  }

  async uninstallItem(workspaceId: string, itemId: string) {
    const existing = await marketplaceRepo.findInstall(workspaceId, itemId);
    if (!existing) throw new NotFoundError("Installation not found");

    return marketplaceRepo.updateInstall(existing.id, { enabled: false });
  }

  async recordPurchase(workspaceId: string, itemId: string, stripePaymentIntentId?: string, stripeSubscriptionItemId?: string) {
    const existing = await marketplaceRepo.findPurchase(workspaceId, itemId);
    if (existing) return existing;

    const purchase = await marketplaceRepo.createPurchase({
      workspaceId,
      marketplaceItemId: itemId,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
      stripeSubscriptionItemId: stripeSubscriptionItemId ?? null,
    });

    const install = await marketplaceRepo.findInstall(workspaceId, itemId);
    if (install) {
      await marketplaceRepo.updateInstall(install.id, { purchased: true, enabled: true });
    } else {
      await marketplaceRepo.createInstall({
        workspaceId,
        itemId,
        enabled: true,
        purchased: true,
      });
    }

    return purchase;
  }

  async revokePurchaseBySubscriptionItemId(stripeSubscriptionItemId: string) {
    return marketplaceRepo.deletePurchaseBySubscriptionItemId(stripeSubscriptionItemId);
  }

  async startPreview(workspaceId: string, itemId: string) {
    const item = await marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundError("Marketplace item");

    const existing = await marketplaceRepo.findPreviewSession(workspaceId, itemId);
    if (existing) return existing;

    return marketplaceRepo.createPreviewSession({
      workspaceId,
      itemId,
      previewStateJson: { active: true, startedAt: new Date().toISOString() },
    });
  }

  async endPreview(workspaceId: string, itemId: string) {
    const existing = await marketplaceRepo.findPreviewSession(workspaceId, itemId);
    if (!existing) throw new NotFoundError("Preview session");
    return marketplaceRepo.deletePreviewSession(existing.id);
  }
}

export const marketplaceService = new MarketplaceService();
