import { type User, type InsertUser, type Workspace, type InsertWorkspace, type Membership, type InsertMembership, type Site, type InsertSite, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { db } from "./db";
import { users, workspaces, memberships, sites, auditLog } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: string): Promise<(Workspace & { role: string })[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;

  getMembership(userId: string, workspaceId: string): Promise<Membership | undefined>;
  getMembershipsByWorkspace(workspaceId: string): Promise<Membership[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;

  getSitesByWorkspace(workspaceId: string): Promise<Site[]>;
  getSite(id: string): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;

  createAuditLog(entry: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ?? undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return ws ?? undefined;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, slug));
    return ws ?? undefined;
  }

  async getWorkspacesByUserId(userId: string): Promise<(Workspace & { role: string })[]> {
    const results = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        ownerId: workspaces.ownerId,
        plan: workspaces.plan,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
      .where(eq(memberships.userId, userId));
    return results;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [ws] = await db.insert(workspaces).values(insertWorkspace).returning();
    return ws;
  }

  async getMembership(userId: string, workspaceId: string): Promise<Membership | undefined> {
    const [m] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.workspaceId, workspaceId)));
    return m ?? undefined;
  }

  async getMembershipsByWorkspace(workspaceId: string): Promise<Membership[]> {
    return db.select().from(memberships).where(eq(memberships.workspaceId, workspaceId));
  }

  async createMembership(insertMembership: InsertMembership): Promise<Membership> {
    const [m] = await db.insert(memberships).values(insertMembership).returning();
    return m;
  }

  async getSitesByWorkspace(workspaceId: string): Promise<Site[]> {
    return db.select().from(sites).where(eq(sites.workspaceId, workspaceId));
  }

  async getSite(id: string): Promise<Site | undefined> {
    const [s] = await db.select().from(sites).where(eq(sites.id, id));
    return s ?? undefined;
  }

  async createSite(insertSite: InsertSite): Promise<Site> {
    const [s] = await db.insert(sites).values(insertSite).returning();
    return s;
  }

  async createAuditLog(entry: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLog).values(entry).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
