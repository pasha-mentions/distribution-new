import {
  users,
  organizations,
  orgMembers,
  artists,
  releases,
  tracks,
  splitShares,
  qcItems,
  deliveryJobs,
  reportRows,
  auditLogs,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type OrgMember,
  type Artist,
  type InsertArtist,
  type Release,
  type InsertRelease,
  type Track,
  type InsertTrack,
  type SplitShare,
  type InsertSplitShare,
  type QCItem,
  type DeliveryJob,
  type ReportRow,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth and Google OAuth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUserFromGoogle(userData: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    role?: "ARTIST" | "LABEL" | "TEAM" | "ADMIN";
  }): Promise<User>;
  linkGoogleAccount(userId: string, googleId: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  addOrgMember(orgId: string, userId: string, role: string): Promise<OrgMember>;
  getOrgMembers(orgId: string): Promise<(OrgMember & { user: User })[]>;
  
  // Artist operations
  createArtist(artist: InsertArtist): Promise<Artist>;
  getArtists(orgId: string): Promise<Artist[]>;
  getArtist(id: string): Promise<Artist | undefined>;
  
  // Release operations
  createRelease(release: InsertRelease): Promise<Release>;
  getRelease(id: string): Promise<Release | undefined>;
  getReleases(orgId: string): Promise<Release[]>;
  updateRelease(id: string, updates: Partial<Release>): Promise<Release>;
  getRecentReleases(orgId: string, limit?: number): Promise<(Release & { artist: Artist })[]>;
  getAllReleases(limit?: number): Promise<(Release & { artist: Artist; organization: Organization })[]>;
  getReleaseDetails(id: string): Promise<(Release & { artist: Artist; organization: Organization; tracks: Track[] }) | undefined>;
  
  // Track operations
  createTrack(track: InsertTrack): Promise<Track>;
  getTracks(releaseId: string): Promise<Track[]>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track>;
  
  // Split share operations
  createSplitShare(splitShare: InsertSplitShare): Promise<SplitShare>;
  getSplitShares(releaseId?: string, trackId?: string): Promise<SplitShare[]>;
  
  // QC operations
  createQCItem(item: Omit<QCItem, 'id' | 'createdAt'>): Promise<QCItem>;
  getQCItems(releaseId: string): Promise<QCItem[]>;
  getPendingQCReleases(): Promise<(Release & { artist: Artist; organization: Organization })[]>;
  
  // Delivery operations
  createDeliveryJob(job: Omit<DeliveryJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryJob>;
  getDeliveryJobs(releaseId: string): Promise<DeliveryJob[]>;
  updateDeliveryJob(id: string, updates: Partial<DeliveryJob>): Promise<DeliveryJob>;
  
  // Reporting operations
  createReportRow(row: Omit<ReportRow, 'id' | 'createdAt'>): Promise<ReportRow>;
  getReportRows(orgId: string, period?: string): Promise<ReportRow[]>;
  getRevenueSummary(orgId: string): Promise<{ totalRevenue: number; streams: number }>;
  
  // Audit log
  logAction(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  
  // Statistics
  getOrgStats(orgId: string): Promise<{
    totalRevenue: number;
    activeReleases: number;
    totalStreams: number;
    pendingReview: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth and Google OAuth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUserFromGoogle(userData: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    role?: "ARTIST" | "LABEL" | "TEAM" | "ADMIN";
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        googleId: userData.googleId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        role: userData.role || "ARTIST"
      })
      .returning();
    return user;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const userOrgs = await db
      .select({ organization: organizations })
      .from(orgMembers)
      .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
      .where(eq(orgMembers.userId, userId));
    
    return userOrgs.map(item => item.organization);
  }

  async addOrgMember(orgId: string, userId: string, role: string): Promise<OrgMember> {
    const [member] = await db
      .insert(orgMembers)
      .values({ orgId, userId, role })
      .returning();
    return member;
  }

  async getOrgMembers(orgId: string): Promise<(OrgMember & { user: User })[]> {
    const members = await db
      .select()
      .from(orgMembers)
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(eq(orgMembers.orgId, orgId));
    
    return members.map(item => ({
      ...item.org_members,
      user: item.users,
    }));
  }

  // Artist operations
  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db.insert(artists).values(artist).returning();
    return newArtist;
  }

  async getArtists(orgId: string): Promise<Artist[]> {
    return await db.select().from(artists).where(eq(artists.orgId, orgId));
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist;
  }

  // Release operations
  async createRelease(release: InsertRelease): Promise<Release> {
    const [newRelease] = await db.insert(releases).values(release).returning();
    return newRelease;
  }

  async getRelease(id: string): Promise<Release | undefined> {
    const [release] = await db.select().from(releases).where(eq(releases.id, id));
    return release;
  }

  async getReleases(orgId: string): Promise<Release[]> {
    return await db
      .select()
      .from(releases)
      .where(eq(releases.orgId, orgId))
      .orderBy(desc(releases.createdAt));
  }

  async updateRelease(id: string, updates: Partial<Release>): Promise<Release> {
    const [updated] = await db
      .update(releases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(releases.id, id))
      .returning();
    return updated;
  }

  async getRecentReleases(orgId: string, limit = 5): Promise<(Release & { artist: Artist })[]> {
    const recentReleases = await db
      .select()
      .from(releases)
      .innerJoin(artists, eq(releases.artistId, artists.id))
      .where(eq(releases.orgId, orgId))
      .orderBy(desc(releases.createdAt))
      .limit(limit);
    
    return recentReleases.map(item => ({
      ...item.releases,
      artist: item.artists,
    }));
  }

  async getAllReleases(limit = 50): Promise<(Release & { artist: Artist; organization: Organization })[]> {
    const allReleases = await db
      .select()
      .from(releases)
      .innerJoin(artists, eq(releases.artistId, artists.id))
      .innerJoin(organizations, eq(releases.orgId, organizations.id))
      .orderBy(desc(releases.createdAt))
      .limit(limit);
    
    return allReleases.map(item => ({
      ...item.releases,
      artist: item.artists,
      organization: item.organizations,
    }));
  }

  async getReleaseDetails(id: string): Promise<(Release & { artist: Artist; organization: Organization; tracks: Track[] }) | undefined> {
    // Get release with artist and organization
    const releaseQuery = await db
      .select()
      .from(releases)
      .innerJoin(artists, eq(releases.artistId, artists.id))
      .innerJoin(organizations, eq(releases.orgId, organizations.id))
      .where(eq(releases.id, id));
    
    if (releaseQuery.length === 0) {
      return undefined;
    }
    
    const releaseData = releaseQuery[0];
    
    // Get tracks for this release
    const releaseTracks = await this.getTracks(id);
    
    return {
      ...releaseData.releases,
      artist: releaseData.artists,
      organization: releaseData.organizations,
      tracks: releaseTracks,
    };
  }

  // Track operations
  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db.insert(tracks).values(track).returning();
    return newTrack;
  }

  async getTracks(releaseId: string): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.releaseId, releaseId))
      .orderBy(asc(tracks.trackIndex));
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track> {
    const [updated] = await db
      .update(tracks)
      .set(updates)
      .where(eq(tracks.id, id))
      .returning();
    return updated;
  }

  // Split share operations
  async createSplitShare(splitShare: InsertSplitShare): Promise<SplitShare> {
    const [newSplit] = await db.insert(splitShares).values(splitShare).returning();
    return newSplit;
  }

  async getSplitShares(releaseId?: string, trackId?: string): Promise<SplitShare[]> {
    const conditions = [] as any[];
    if (releaseId) {
      conditions.push(eq(splitShares.releaseId, releaseId));
    }
    if (trackId) {
      conditions.push(eq(splitShares.trackId, trackId));
    }

    if (conditions.length > 0) {
      return await db.select().from(splitShares).where(and(...conditions));
    }
    return await db.select().from(splitShares);
  }

  // QC operations
  async createQCItem(item: Omit<QCItem, 'id' | 'createdAt'>): Promise<QCItem> {
    const [qcItem] = await db.insert(qcItems).values(item).returning();
    return qcItem;
  }

  async getQCItems(releaseId: string): Promise<QCItem[]> {
    return await db.select().from(qcItems).where(eq(qcItems.releaseId, releaseId));
  }

  async getPendingQCReleases(): Promise<(Release & { artist: Artist; organization: Organization })[]> {
    const pending = await db
      .select()
      .from(releases)
      .innerJoin(artists, eq(releases.artistId, artists.id))
      .innerJoin(organizations, eq(releases.orgId, organizations.id))
      .where(eq(releases.status, "IN_REVIEW"))
      .orderBy(asc(releases.updatedAt));
    
    return pending.map(item => ({
      ...item.releases,
      artist: item.artists,
      organization: item.organizations,
    }));
  }

  // Delivery operations
  async createDeliveryJob(job: Omit<DeliveryJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryJob> {
    const [deliveryJob] = await db.insert(deliveryJobs).values(job).returning();
    return deliveryJob;
  }

  async getDeliveryJobs(releaseId: string): Promise<DeliveryJob[]> {
    return await db
      .select()
      .from(deliveryJobs)
      .where(eq(deliveryJobs.releaseId, releaseId))
      .orderBy(desc(deliveryJobs.createdAt));
  }

  async updateDeliveryJob(id: string, updates: Partial<DeliveryJob>): Promise<DeliveryJob> {
    const [updated] = await db
      .update(deliveryJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id))
      .returning();
    return updated;
  }

  // Reporting operations
  async createReportRow(row: Omit<ReportRow, 'id' | 'createdAt'>): Promise<ReportRow> {
    const [reportRow] = await db.insert(reportRows).values(row).returning();
    return reportRow;
  }

  async getReportRows(orgId: string, period?: string): Promise<ReportRow[]> {
    
    if (period) {
      return await db
      .select()
      .from(reportRows)
      .where(and(eq(reportRows.orgId, orgId), eq(reportRows.period, period)))
      .orderBy(desc(reportRows.createdAt));
    }

    return await db
      .select()
      .from(reportRows)
      .where(eq(reportRows.orgId, orgId))
      .orderBy(desc(reportRows.createdAt));
  }

  async getRevenueSummary(orgId: string): Promise<{ totalRevenue: number; streams: number }> {
    const summary = await db
      .select()
      .from(reportRows)
      .where(eq(reportRows.orgId, orgId));
    
    const totalRevenue = summary.reduce((sum, row) => sum + (row.revenueCents || 0), 0) / 100;
    const streams = summary.reduce((sum, row) => sum + (row.units || 0), 0);
    
    return { totalRevenue, streams };
  }

  // Audit log
  async logAction(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  // Statistics
  async getOrgStats(orgId: string): Promise<{
    totalRevenue: number;
    activeReleases: number;
    totalStreams: number;
    pendingReview: number;
  }> {
    const [releaseStats] = await db
      .select()
      .from(releases)
      .where(eq(releases.orgId, orgId));
    
    const activeReleases = await db
      .select()
      .from(releases)
      .where(and(
        eq(releases.orgId, orgId),
        inArray(releases.status, ["DELIVERED", "DELIVERING"])
      ));
    
    const pendingReleases = await db
      .select()
      .from(releases)
      .where(and(
        eq(releases.orgId, orgId),
        eq(releases.status, "IN_REVIEW")
      ));
    
    const { totalRevenue, streams } = await this.getRevenueSummary(orgId);
    
    return {
      totalRevenue,
      activeReleases: activeReleases.length,
      totalStreams: streams,
      pendingReview: pendingReleases.length,
    };
  }
}

export const storage = new DatabaseStorage();
