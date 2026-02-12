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

export const pageStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export type PageStatus = z.infer<typeof pageStatusEnum>;

export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  status: text("status").notNull().default("DRAFT"),
  publishedAt: timestamp("published_at"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoImage: text("seo_image"),
  canonicalUrl: text("canonical_url"),
  indexable: boolean("indexable").notNull().default(true),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

export const pageRevisions = pgTable("page_revisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  contentJson: jsonb("content_json").notNull().default(sql`'{}'::jsonb`),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPageRevisionSchema = createInsertSchema(pageRevisions).omit({
  id: true,
  createdAt: true,
});

export type InsertPageRevision = z.infer<typeof insertPageRevisionSchema>;
export type PageRevision = typeof pageRevisions.$inferSelect;

export const collectionFieldTypeEnum = z.enum([
  "text",
  "richtext",
  "number",
  "boolean",
  "date",
  "image",
  "select",
  "multiselect",
  "url",
]);
export type CollectionFieldType = z.infer<typeof collectionFieldTypeEnum>;

export const collectionFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: collectionFieldTypeEnum,
  required: z.boolean().default(false),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.unknown().optional(),
});
export type CollectionField = z.infer<typeof collectionFieldSchema>;

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  schemaJson: jsonb("schema_json").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export const collectionItems = pgTable("collection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;

export const collectionItemRevisions = pgTable("collection_item_revisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => collectionItems.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  dataJson: jsonb("data_json").notNull().default(sql`'{}'::jsonb`),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCollectionItemRevisionSchema = createInsertSchema(collectionItemRevisions).omit({
  id: true,
  createdAt: true,
});

export type InsertCollectionItemRevision = z.infer<typeof insertCollectionItemRevisionSchema>;
export type CollectionItemRevision = typeof collectionItemRevisions.$inferSelect;

export const themeTokenModeSchema = z.object({
  surface: z.string(),
  surfaceAlt: z.string(),
  text: z.string(),
  textMuted: z.string(),
  border: z.string(),
  accent: z.string(),
  accentText: z.string(),
});

export type ThemeTokenMode = z.infer<typeof themeTokenModeSchema>;

export const themeTokensSchema = z.object({
  light: themeTokenModeSchema,
  dark: themeTokenModeSchema,
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;

export const layoutPresetsSchema = z.object({
  headerStyle: z.enum(["standard", "centered", "minimal", "transparent"]),
  footerStyle: z.enum(["standard", "minimal", "columns", "centered"]),
  sectionSpacing: z.enum(["compact", "comfortable", "spacious"]),
  containerWidth: z.enum(["narrow", "standard", "wide", "full"]),
  buttonStyle: z.enum(["square", "rounded", "pill"]),
});

export type LayoutPresets = z.infer<typeof layoutPresetsSchema>;

export const siteThemes = pgTable("site_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }).unique(),
  tokensJson: jsonb("tokens_json").notNull().default(sql`'{}'::jsonb`),
  layoutJson: jsonb("layout_json").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteThemeSchema = createInsertSchema(siteThemes).omit({
  id: true,
  updatedAt: true,
});

export type InsertSiteTheme = z.infer<typeof insertSiteThemeSchema>;
export type SiteTheme = typeof siteThemes.$inferSelect;

export const menuSlotEnum = z.enum(["header", "footer"]);
export type MenuSlot = z.infer<typeof menuSlotEnum>;

export const menuItemTypeEnum = z.enum(["page", "collection_list", "collection_item", "external_url"]);
export type MenuItemType = z.infer<typeof menuItemTypeEnum>;

export const menus = pgTable("menus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slot: text("slot"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMenuSchema = createInsertSchema(menus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = typeof menus.$inferSelect;

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuId: varchar("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  type: text("type").notNull().default("page"),
  label: text("label").notNull(),
  target: text("target"),
  openInNewTab: boolean("open_in_new_tab").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export const siteDomains = pgTable("site_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  isPrimary: boolean("is_primary").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSiteDomainSchema = createInsertSchema(siteDomains).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export type InsertSiteDomain = z.infer<typeof insertSiteDomainSchema>;
export type SiteDomain = typeof siteDomains.$inferSelect;

export const formFieldTypeEnum = z.enum([
  "text", "textarea", "email", "phone", "select", "checkbox", "radio", "date",
]);
export type FormFieldType = z.infer<typeof formFieldTypeEnum>;

export const formFieldSchema = z.object({
  id: z.string(),
  type: formFieldTypeEnum,
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
});
export type FormField = z.infer<typeof formFieldSchema>;

export const formSettingsSchema = z.object({
  notifyEmails: z.array(z.string().email()).optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  submitLabel: z.string().optional(),
  successMessage: z.string().optional(),
  honeypotEnabled: z.boolean().optional(),
  rateLimitPerMinute: z.number().int().min(1).max(120).optional(),
});
export type FormSettings = z.infer<typeof formSettingsSchema>;

export const forms = pgTable("forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fieldsJson: jsonb("fields_json").notNull().default([]),
  settingsJson: jsonb("settings_json").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof forms.$inferSelect;

export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  payloadJson: jsonb("payload_json").notNull().default({}),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

export const redirects = pgTable("redirects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  fromPath: text("from_path").notNull(),
  toUrl: text("to_url").notNull(),
  code: integer("code").notNull().default(301),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRedirectSchema = createInsertSchema(redirects).omit({
  id: true,
  createdAt: true,
});

export type InsertRedirect = z.infer<typeof insertRedirectSchema>;
export type Redirect = typeof redirects.$inferSelect;

export const redirectSuggestions = pgTable("redirect_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  fromPath: text("from_path").notNull(),
  toUrl: text("to_url").notNull(),
  source: text("source").notNull().default("wp_import"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRedirectSuggestionSchema = createInsertSchema(redirectSuggestions).omit({
  id: true,
  createdAt: true,
});

export type InsertRedirectSuggestion = z.infer<typeof insertRedirectSuggestionSchema>;
export type RedirectSuggestion = typeof redirectSuggestions.$inferSelect;

export const siteSeoSettings = pgTable("site_seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }).unique(),
  titleSuffix: text("title_suffix"),
  defaultOgImage: text("default_og_image"),
  defaultIndexable: boolean("default_indexable").notNull().default(true),
  robotsTxt: text("robots_txt"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSeoSettingsSchema = createInsertSchema(siteSeoSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSiteSeoSettings = z.infer<typeof insertSiteSeoSettingsSchema>;
export type SiteSeoSettings = typeof siteSeoSettings.$inferSelect;
