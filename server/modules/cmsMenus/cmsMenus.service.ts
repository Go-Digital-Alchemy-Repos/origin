import { db } from "../../db";
import { menus, menuItems } from "@shared/schema";
import type { InsertMenu, Menu, InsertMenuItem, MenuItem } from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export interface MenuWithItems extends Menu {
  items: MenuItem[];
}

export const cmsMenusService = {
  async getMenusBySite(siteId: string, workspaceId: string): Promise<Menu[]> {
    return db
      .select()
      .from(menus)
      .where(and(eq(menus.siteId, siteId), eq(menus.workspaceId, workspaceId)))
      .orderBy(asc(menus.name));
  },

  async getMenu(menuId: string): Promise<Menu | undefined> {
    const [menu] = await db.select().from(menus).where(eq(menus.id, menuId));
    return menu ?? undefined;
  },

  async getMenuForWorkspace(menuId: string, workspaceId: string): Promise<Menu | undefined> {
    const [menu] = await db
      .select()
      .from(menus)
      .where(and(eq(menus.id, menuId), eq(menus.workspaceId, workspaceId)));
    return menu ?? undefined;
  },

  async getMenuWithItems(menuId: string): Promise<MenuWithItems | undefined> {
    const menu = await cmsMenusService.getMenu(menuId);
    if (!menu) return undefined;
    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.menuId, menuId))
      .orderBy(asc(menuItems.sortOrder));
    return { ...menu, items };
  },

  async createMenu(data: {
    name: string;
    siteId: string;
    workspaceId: string;
    slot?: string | null;
  }): Promise<Menu> {
    const [menu] = await db
      .insert(menus)
      .values({
        name: data.name,
        siteId: data.siteId,
        workspaceId: data.workspaceId,
        slot: data.slot ?? null,
      })
      .returning();
    return menu;
  },

  async updateMenu(
    menuId: string,
    data: { name?: string; slot?: string | null },
  ): Promise<Menu> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.slot !== undefined) updateFields.slot = data.slot;

    const [menu] = await db
      .update(menus)
      .set(updateFields)
      .where(eq(menus.id, menuId))
      .returning();
    return menu;
  },

  async deleteMenu(menuId: string): Promise<void> {
    await db.delete(menus).where(eq(menus.id, menuId));
  },

  async addMenuItem(data: {
    menuId: string;
    parentId?: string | null;
    type: string;
    label: string;
    target?: string | null;
    openInNewTab?: boolean;
    sortOrder?: number;
  }): Promise<MenuItem> {
    let order = data.sortOrder ?? 0;
    if (data.sortOrder === undefined) {
      const [result] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${menuItems.sortOrder}), -1)` })
        .from(menuItems)
        .where(
          and(
            eq(menuItems.menuId, data.menuId),
            data.parentId
              ? eq(menuItems.parentId, data.parentId)
              : sql`${menuItems.parentId} IS NULL`,
          ),
        );
      order = (result?.maxOrder ?? -1) + 1;
    }

    const [item] = await db
      .insert(menuItems)
      .values({
        menuId: data.menuId,
        parentId: data.parentId ?? null,
        type: data.type,
        label: data.label,
        target: data.target ?? null,
        openInNewTab: data.openInNewTab ?? false,
        sortOrder: order,
      })
      .returning();
    return item;
  },

  async updateMenuItem(
    itemId: string,
    data: {
      label?: string;
      type?: string;
      target?: string | null;
      openInNewTab?: boolean;
      parentId?: string | null;
      sortOrder?: number;
    },
  ): Promise<MenuItem> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.label !== undefined) updateFields.label = data.label;
    if (data.type !== undefined) updateFields.type = data.type;
    if (data.target !== undefined) updateFields.target = data.target;
    if (data.openInNewTab !== undefined) updateFields.openInNewTab = data.openInNewTab;
    if (data.parentId !== undefined) updateFields.parentId = data.parentId;
    if (data.sortOrder !== undefined) updateFields.sortOrder = data.sortOrder;

    const [item] = await db
      .update(menuItems)
      .set(updateFields)
      .where(eq(menuItems.id, itemId))
      .returning();
    return item;
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, itemId));
  },

  async reorderItems(
    menuId: string,
    tree: Array<{ id: string; parentId: string | null; sortOrder: number }>,
  ): Promise<MenuItem[]> {
    return db.transaction(async (tx) => {
      for (const node of tree) {
        await tx
          .update(menuItems)
          .set({
            parentId: node.parentId,
            sortOrder: node.sortOrder,
            updatedAt: new Date(),
          })
          .where(and(eq(menuItems.id, node.id), eq(menuItems.menuId, menuId)));
      }

      return tx
        .select()
        .from(menuItems)
        .where(eq(menuItems.menuId, menuId))
        .orderBy(asc(menuItems.sortOrder));
    });
  },

  async getMenuBySlot(
    siteId: string,
    slot: string,
  ): Promise<MenuWithItems | null> {
    const [menu] = await db
      .select()
      .from(menus)
      .where(and(eq(menus.siteId, siteId), eq(menus.slot, slot)))
      .limit(1);

    if (!menu) return null;

    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.menuId, menu.id))
      .orderBy(asc(menuItems.sortOrder));

    return { ...menu, items };
  },
};
