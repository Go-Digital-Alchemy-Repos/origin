import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = z.enum([
  "SUPER_ADMIN",
  "AGENCY_ADMIN",
  "CLIENT_ADMIN",
  "CLIENT_EDITOR",
  "CLIENT_VIEWER",
]);

export type Role = z.infer<typeof roleEnum>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("CLIENT_VIEWER"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  activeWorkspaceId: varchar("active_workspace_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Session = typeof sessions.$inferSelect;

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Account = typeof accounts.$inferSelect;

export const verifications = pgTable("verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Verification = typeof verifications.$inferSelect;

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("starter"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("CLIENT_VIEWER"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
});

export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;

export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  domain: text("domain"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sites.$inferSelect;

export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  workspaceId: varchar("workspace_id"),
  action: text("action").notNull(),
  resource: text("resource"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

export const docEntries = pgTable("doc_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull().default("developer"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocEntrySchema = createInsertSchema(docEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocEntry = z.infer<typeof insertDocEntrySchema>;
export type DocEntry = typeof docEntries.$inferSelect;

export const originModules = pgTable("origin_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  version: text("version").notNull().default("1.0.0"),
  category: text("category").notNull(),
  icon: text("icon"),
  isCore: boolean("is_core").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(originModules).omit({
  id: true,
  createdAt: true,
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type OriginModule = typeof originModules.$inferSelect;

export const stripeCustomers = pgTable("stripe_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStripeCustomerSchema = createInsertSchema(stripeCustomers).omit({
  id: true,
  createdAt: true,
});

export type InsertStripeCustomer = z.infer<typeof insertStripeCustomerSchema>;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;

export const subscriptionStatusEnum = z.enum([
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "trialing",
  "unpaid",
  "paused",
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }).unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: text("status").notNull().default("incomplete"),
  plan: text("plan").notNull().default("starter"),
  siteQuantity: integer("site_quantity").notNull().default(1),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const entitlements = pgTable("entitlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }).unique(),
  features: jsonb("features").notNull().default(sql`'[]'::jsonb`),
  limits: jsonb("limits").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEntitlementSchema = createInsertSchema(entitlements).omit({
  id: true,
  updatedAt: true,
});

export type InsertEntitlement = z.infer<typeof insertEntitlementSchema>;
export type Entitlement = typeof entitlements.$inferSelect;

export const docCategoryEnum = z.enum([
  "getting-started",
  "architecture",
  "modules",
  "api-reference",
  "guides",
  "help",
  "marketplace",
]);

export type DocCategory = z.infer<typeof docCategoryEnum>;

export const marketplaceItemTypeEnum = z.enum([
  "site-kit",
  "section",
  "widget",
  "app",
  "add-on",
]);

export type MarketplaceItemType = z.infer<typeof marketplaceItemTypeEnum>;

export const marketplaceItems = pgTable("marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  icon: text("icon"),
  coverImage: text("cover_image"),
  author: text("author").notNull().default("ORIGIN"),
  priceId: text("price_id"),
  isFree: boolean("is_free").notNull().default(true),
  price: integer("price").notNull().default(0),
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("published"),
  category: text("category"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  metadata: jsonb("metadata"),
  docSlug: text("doc_slug"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

export const marketplaceInstalls = pgTable("marketplace_installs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => marketplaceItems.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  purchased: boolean("purchased").notNull().default(false),
  installedAt: timestamp("installed_at").defaultNow(),
});

export const insertMarketplaceInstallSchema = createInsertSchema(marketplaceInstalls).omit({
  id: true,
  installedAt: true,
});

export type InsertMarketplaceInstall = z.infer<typeof insertMarketplaceInstallSchema>;
export type MarketplaceInstall = typeof marketplaceInstalls.$inferSelect;

export const previewSessions = pgTable("preview_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => marketplaceItems.id, { onDelete: "cascade" }),
  previewStateJson: jsonb("preview_state_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPreviewSessionSchema = createInsertSchema(previewSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertPreviewSession = z.infer<typeof insertPreviewSessionSchema>;
export type PreviewSession = typeof previewSessions.$inferSelect;
