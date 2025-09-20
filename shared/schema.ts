import { sql, relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["ARTIST", "LABEL", "TEAM", "ADMIN"]);
export const releaseTypeEnum = pgEnum("release_type", ["SINGLE", "EP", "ALBUM"]);
export const releaseStatusEnum = pgEnum("release_status", [
  "DRAFT", "IN_REVIEW", "APPROVED", "DELIVERING", "DELIVERED", "TAKEDOWN", "REJECTED"
]);
export const trackStatusEnum = pgEnum("track_status", ["DRAFT", "READY", "DELIVERED"]);
export const qcIssueSeverityEnum = pgEnum("qc_issue_severity", ["INFO", "WARN", "ERROR"]);
export const reportSourceEnum = pgEnum("report_source", [
  "SPOTIFY", "APPLE", "YT_MUSIC", "DEEZER", "TIKTOK", "IG", "SHORTS", "OTHER"
]);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth and Google OAuth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(),
  role: roleEnum("role").default("ARTIST"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations (Labels or Artist-Orgs)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // "ARTIST_ORG" | "LABEL"
  balance: integer("balance").default(0), // cents
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  planType: varchar("plan_type").default("FREE"), // FREE, PRO
  monthlyReleaseLimit: integer("monthly_release_limit").default(2),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Members
export const orgMembers = pgTable("org_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull(), // "OWNER" | "MANAGER" | "EDITOR" | "VIEWER"
  createdAt: timestamp("created_at").defaultNow(),
});

// Artists
export const artists = pgTable("artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull(),
  name: varchar("name").notNull(),
  upcPrefix: varchar("upc_prefix"), // for UPC/ISRC generation
  createdAt: timestamp("created_at").defaultNow(),
});

// Releases
export const releases = pgTable("releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull(),
  artistId: varchar("artist_id").notNull(),
  type: releaseTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  upc: varchar("upc"),
  primaryGenre: varchar("primary_genre"),
  secondaryGenre: varchar("secondary_genre"),
  language: varchar("language"),
  albumVersion: varchar("album_version"),
  originalReleaseDate: timestamp("original_release_date"),
  releaseDate: timestamp("release_date"),
  releaseTime: varchar("release_time"), // HH:MM format
  subLabel: varchar("sub_label"),
  status: releaseStatusEnum("status").default("DRAFT"),
  territories: text("territories").array(), // ISO country codes
  rightsOwner: varchar("rights_owner"),
  artworkUrl: varchar("artwork_url"),
  artworkOriginalName: varchar("artwork_original_name"),
  artworkSize: integer("artwork_size"), // bytes
  labelName: varchar("label_name"),
  pCopyright: varchar("p_copyright"),
  performers: jsonb("performers"), // array of {name: string, role: string}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tracks
export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").notNull(),
  title: varchar("title").notNull(),
  isrc: varchar("isrc"),
  trackIndex: integer("track_index").notNull(),
  explicit: boolean("explicit").default(false),
  audioUrl: varchar("audio_url"),
  audioOriginalName: varchar("audio_original_name"),
  audioSize: integer("audio_size"), // bytes
  lyrics: text("lyrics"),
  version: varchar("version"), // "Original", "Radio Edit", "Instrumental"
  duration: integer("duration"), // seconds
  participants: jsonb("participants"), // authors/composers/publishers/roles
  status: trackStatusEnum("status").default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Split Shares
export const splitShares = pgTable("split_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id"),
  trackId: varchar("track_id"),
  userId: varchar("user_id"), // if exists in system
  email: varchar("email").notNull(), // if not registered yet
  percent: decimal("percent", { precision: 5, scale: 2 }).notNull(),
  role: varchar("role"), // "artist"|"producer"|...
  createdAt: timestamp("created_at").defaultNow(),
});

// QC Items
export const qcItems = pgTable("qc_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").notNull(),
  trackId: varchar("track_id"),
  severity: qcIssueSeverityEnum("severity").notNull(),
  message: text("message").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery Jobs
export const deliveryJobs = pgTable("delivery_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").notNull(),
  target: varchar("target").notNull(), // "SPOTIFY"|"APPLE"|...
  status: varchar("status").default("PENDING"), // "PENDING"|"SENT"|"FAILED"
  payload: jsonb("payload"),
  response: jsonb("response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Report Rows
export const reportRows = pgTable("report_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull(),
  period: varchar("period").notNull(), // "2025-01"
  source: reportSourceEnum("source").notNull(),
  territory: varchar("territory").notNull(),
  upc: varchar("upc"),
  isrc: varchar("isrc"),
  units: integer("units").default(0),
  revenueCents: integer("revenue_cents").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id"),
  userId: varchar("user_id"),
  action: varchar("action").notNull(),
  entity: varchar("entity"),
  entityId: varchar("entity_id"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orgMembers: many(orgMembers),
  splitShares: many(splitShares),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(orgMembers),
  artists: many(artists),
  releases: many(releases),
  reportRows: many(reportRows),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgMembers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgMembers.userId],
    references: [users.id],
  }),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [artists.orgId],
    references: [organizations.id],
  }),
  releases: many(releases),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [releases.orgId],
    references: [organizations.id],
  }),
  artist: one(artists, {
    fields: [releases.artistId],
    references: [artists.id],
  }),
  tracks: many(tracks),
  qcItems: many(qcItems),
  splitShares: many(splitShares),
  deliveryJobs: many(deliveryJobs),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  release: one(releases, {
    fields: [tracks.releaseId],
    references: [releases.id],
  }),
  splitShares: many(splitShares),
  qcItems: many(qcItems),
}));

export const splitSharesRelations = relations(splitShares, ({ one }) => ({
  release: one(releases, {
    fields: [splitShares.releaseId],
    references: [releases.id],
  }),
  track: one(tracks, {
    fields: [splitShares.trackId],
    references: [tracks.id],
  }),
  user: one(users, {
    fields: [splitShares.userId],
    references: [users.id],
  }),
}));

export const qcItemsRelations = relations(qcItems, ({ one }) => ({
  release: one(releases, {
    fields: [qcItems.releaseId],
    references: [releases.id],
  }),
  track: one(tracks, {
    fields: [qcItems.trackId],
    references: [tracks.id],
  }),
}));

export const deliveryJobsRelations = relations(deliveryJobs, ({ one }) => ({
  release: one(releases, {
    fields: [deliveryJobs.releaseId],
    references: [releases.id],
  }),
}));

export const reportRowsRelations = relations(reportRows, ({ one }) => ({
  organization: one(organizations, {
    fields: [reportRows.orgId],
    references: [organizations.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Admin update schema - only allows safe fields to be updated
export const adminUpdateReleaseSchema = z.object({
  title: z.string().min(1).optional(),
  upc: z.string().optional(),
  primaryGenre: z.string().optional(),
  secondaryGenre: z.string().optional(),
  language: z.string().optional(),
  albumVersion: z.string().optional(),
  originalReleaseDate: z.coerce.date().nullable().optional(),
  releaseDate: z.coerce.date().nullable().optional(),
  releaseTime: z.string().optional(),
  subLabel: z.string().optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "DELIVERING", "DELIVERED", "TAKEDOWN", "REJECTED"]).optional(),
  territories: z.array(z.string()).optional(),
  labelName: z.string().optional(),
  pCopyright: z.string().optional(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

export const insertSplitShareSchema = createInsertSchema(splitShares).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect & {
  organizations?: Organization[];
};
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrgMember = typeof orgMembers.$inferSelect;

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;

export type Release = typeof releases.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;

export type SplitShare = typeof splitShares.$inferSelect;
export type InsertSplitShare = z.infer<typeof insertSplitShareSchema>;

export type QCItem = typeof qcItems.$inferSelect;
export type DeliveryJob = typeof deliveryJobs.$inferSelect;
export type ReportRow = typeof reportRows.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
