import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { setupGoogleAuthRoutes } from "./googleAuth";
import { isAuthenticated } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { z } from "zod";
import {
  insertTrackSchema,
  insertArtistSchema,
  insertOrganizationSchema,
  insertReleaseSchema,
  insertSplitShareSchema,
  adminUpdateReleaseSchema,
  type User,
} from "@shared/schema";

// Auth user types
interface ReplitAuthUser {
  claims: {
    sub: string;
    email?: string;
    [key: string]: any;
  };
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

interface GoogleAuthUser extends User {
  id: string;
}

type AuthenticatedUser = ReplitAuthUser | GoogleAuthUser;

// Helper function to extract user ID from either auth type
function getUserId(user: AuthenticatedUser): string {
  if ('claims' in user) {
    // Replit Auth user
    return user.claims.sub;
  } else {
    // Google OAuth user
    return user.id;
  }
}

// Type for track metadata
interface TrackMetadata {
  title: string;
  isrc?: string;
  explicitContent?: string;
  lyrics?: string;
  version?: string;
  contributors?: any[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("❤️ ROUTES SETUP STARTED - THIS SHOULD APPEAR IN LOGS");
  
  // Add EARLY middleware to log ALL requests - DEBUGGING
  app.use((req, res, next) => {
    console.log("❤️ REQUEST:", req.method, req.path);
    next();
  });

  // Auth middleware
  await setupAuth(app);
  
  // Universal passport serialization for both auth types
  passport.serializeUser((user: any, done) => {
    // Store user data in session
    done(null, user);
  });

  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      // Session user is already the complete user object for both auth types
      done(null, sessionUser);
    } catch (error) {
      done(error, null);
    }
  });
  
  // Google OAuth setup
  setupGoogleAuthRoutes(app);

  // Object Storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = getUserId(req.user as AuthenticatedUser);
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Helper function for UPC generation
  const generateValidUPC = (): string => {
    // For music industry, common prefixes are 0-9
    const prefix = Math.floor(Math.random() * 10).toString();
    
    // Generate 10 random digits for the main part
    let mainPart = '';
    for (let i = 0; i < 10; i++) {
      mainPart += Math.floor(Math.random() * 10).toString();
    }
    
    // Calculate check digit using UPC algorithm
    const digits = prefix + mainPart;
    let oddSum = 0;
    let evenSum = 0;
    
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(digits[i]);
      if (i % 2 === 0) {
        oddSum += digit;
      } else {
        evenSum += digit;
      }
    }
    
    const checkDigit = (10 - ((oddSum * 3 + evenSum) % 10)) % 10;
    return digits + checkDigit.toString();
  };

  // Generate UPC code
  app.post("/api/generate-upc", isAuthenticated, async (req, res) => {
    try {
      const upc = generateValidUPC();
      res.json({ upc });
    } catch (error) {
      console.error("Error generating UPC:", error);
      res.status(500).json({ error: "Failed to generate UPC" });
    }
  });

  // Helper function for ISRC generation
  const generateValidISRC = (): string => {
    // Use UA for Ukraine as country code
    const countryCode = "UA";
    
    // Generate 3-character registrant code (alphanumeric)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let registrantCode = "";
    for (let i = 0; i < 3; i++) {
      registrantCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Use current year (last 2 digits)
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Generate 5-digit designation code
    const designationCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    return `${countryCode}-${registrantCode}-${year}-${designationCode}`;
  };

  // Generate ISRC code
  app.post("/api/generate-isrc", isAuthenticated, async (req, res) => {
    try {
      const isrc = generateValidISRC();
      res.json({ isrc });
    } catch (error) {
      console.error("Error generating ISRC:", error);
      res.status(500).json({ error: "Failed to generate ISRC" });
    }
  });

  // Create release endpoint
  app.post("/api/releases", isAuthenticated, async (req, res) => {
    console.log("🚀 POST /api/releases called");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      console.log("👤 User ID:", userId);
      if (!userId) {
        console.log("❌ User not authenticated");
        return res.status(401).json({ error: "User not authenticated" });
      }

      // New simplified payload path
      if (!req.body.releaseMetadata) {
        let { orgId, artistId, ...rest } = req.body;

        // Determine organization
        let userOrgs = await storage.getUserOrganizations(userId);
        if (!orgId) {
          if (userOrgs.length === 0) {
            const org = await storage.createOrganization({
              name: "My Music",
              type: "ARTIST_ORG",
            });
            await storage.addOrgMember(org.id, userId, "OWNER");
            orgId = org.id;
            userOrgs = [org];
          } else {
            orgId = userOrgs[0].id;
          }
        }

        // Determine artist
        if (!artistId) {
          let artists = await storage.getArtists(orgId);
          if (artists.length === 0) {
            const artist = await storage.createArtist({
              orgId,
              name: rest.performers?.[0]?.name || "Artist Name",
            });
            artistId = artist.id;
          } else {
            artistId = artists[0].id;
          }
        }

        const releaseData = insertReleaseSchema.parse({
          ...rest,
          orgId,
          artistId,
          releaseDate: rest.releaseDate ? new Date(rest.releaseDate) : null,
          originalReleaseDate: rest.originalReleaseDate ? new Date(rest.originalReleaseDate) : null,
        });

        const release = await storage.createRelease(releaseData);
        return res.json(release);
      }

      // Legacy payload path
      
      const { releaseMetadata, tracksMetadata, selectedTerritories } = req.body;
      console.log("📄 Extracted data:", { releaseMetadata, tracksMetadata, selectedTerritories });

      if (!releaseMetadata || !tracksMetadata || !selectedTerritories) {
        return res.status(400).json({ error: "Missing required data" });
      }

      // Get user's organization (for now, assume user has one org or create a default one)
      let userOrgs = await storage.getUserOrganizations(userId);
      let orgId: string;
      
      if (userOrgs.length === 0) {
        // Create a default organization for the user
        const org = await storage.createOrganization({
          name: "My Music",
          type: "ARTIST_ORG",
        });
        await storage.addOrgMember(org.id, userId, "OWNER");
        orgId = org.id;
      } else {
        orgId = userOrgs[0].id;
      }

      // Get or create artist
      let artists = await storage.getArtists(orgId);
      let artistId: string;
      
      if (artists.length === 0) {
        // Create a default artist
        const artist = await storage.createArtist({
          orgId,
          name: releaseMetadata.performers?.[0]?.name || "Artist Name",
        });
        artistId = artist.id;
      } else {
        artistId = artists[0].id;
      }

      // Prepare release data
      const releaseData = {
        orgId,
        artistId,
        type: (tracksMetadata.length === 1
          ? "SINGLE"
          : tracksMetadata.length <= 6
          ? "EP"
          : "ALBUM") as "SINGLE" | "EP" | "ALBUM",
        title: releaseMetadata.title,
        upc: releaseMetadata.upc,
        primaryGenre: releaseMetadata.primaryGenre,
        secondaryGenre: releaseMetadata.secondaryGenre,
        language: releaseMetadata.language,
        albumVersion: releaseMetadata.albumVersion,
        originalReleaseDate: releaseMetadata.originalReleaseDate
          ? new Date(releaseMetadata.originalReleaseDate)
          : null,
        releaseDate: releaseMetadata.releaseDate
          ? new Date(releaseMetadata.releaseDate)
          : null,
        subLabel: releaseMetadata.subLabel,
        territories: selectedTerritories,
        performers: releaseMetadata.performers,
        status: "DRAFT" as const,
      };

      // Create release
      const release = await storage.createRelease(releaseData);
      
      // Create tracks
      const tracksToCreate = tracksMetadata.map(
        (track: TrackMetadata, index: number) => ({
          releaseId: release.id,
          title: track.title,
          isrc: track.isrc,
          trackIndex: index + 1,
          explicit: track.explicitContent === "yes",
          lyrics: track.lyrics,
          version: track.version,
          participants: track.contributors,
        })
      );

      // Create all tracks
      const tracks = await Promise.all(
        tracksToCreate.map((track: typeof tracksToCreate[0]) =>
          storage.createTrack(track)
        )
      );

      res.json({ release, tracks });
    } catch (error) {
      console.error("Error creating release:", error);
      res.status(500).json({ error: "Failed to create release" });
    }
  });

  // Get releases endpoint
  app.get("/api/releases", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user's organizations
      const userOrgs = await storage.getUserOrganizations(userId);
      if (userOrgs.length === 0) {
        return res.json([]);
      }

      // Get releases for all user's organizations
      const allReleases = [];
      for (const org of userOrgs) {
        const releases = await storage.getRecentReleases(org.id, 50);
        allReleases.push(...releases);
      }

      // Sort by creation date
      allReleases.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

      res.json(allReleases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ error: "Failed to fetch releases" });
    }
  });

  // Get ALL releases endpoint (Admin only)
  app.get("/api/admin/releases", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get ALL releases from all organizations
      const allReleases = await storage.getAllReleases(100);

      res.json(allReleases);
    } catch (error) {
      console.error("Error fetching admin releases:", error);
      res.status(500).json({ error: "Failed to fetch admin releases" });
    }
  });

  // Get detailed release info for admin
  app.get("/api/admin/releases/:releaseId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { releaseId } = req.params;
      const release = await storage.getReleaseDetails(releaseId);
      
      if (!release) {
        return res.status(404).json({ error: "Release not found" });
      }
      
      res.json(release);
    } catch (error) {
      console.error("Error fetching release details:", error);
      res.status(500).json({ error: "Failed to fetch release details" });
    }
  });

  // Update release (admin only)
  app.put("/api/admin/releases/:releaseId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { releaseId } = req.params;
      
      // Validate and sanitize update data with admin schema
      const updateData = adminUpdateReleaseSchema.parse(req.body);

      const updatedRelease = await storage.updateRelease(releaseId, updateData);
      
      if (!updatedRelease) {
        return res.status(404).json({ error: "Release not found" });
      }

      // Log the action
      await storage.logAction({
        userId,
        action: "UPDATE_RELEASE",
        entity: "release",
        entityId: releaseId,
        details: `Updated release: ${updatedRelease.title}`,
      });
      
      res.json(updatedRelease);
    } catch (error) {
      console.error("Error updating release:", error);
      
      // Handle validation errors properly
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: error.issues 
        });
      }
      
      res.status(500).json({ error: "Failed to update release" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both Replit Auth and Google OAuth users
      const userId = getUserId(req.user as AuthenticatedUser);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's organizations
      const organizations = await storage.getUserOrganizations(userId);
      
      res.json({
        ...user,
        organizations,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      const orgData = insertOrganizationSchema.parse(req.body);
      
      const organization = await storage.createOrganization(orgData);
      await storage.addOrgMember(organization.id, userId, "OWNER");
      
      await storage.logAction({
        userId,
        orgId: organization.id,
        action: "CREATE_ORGANIZATION",
        entity: "organization",
        entityId: organization.id,
        data: { name: organization.name, type: organization.type },
      });
      
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get('/api/organizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Artist routes
  app.post('/api/artists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      const artistData = insertArtistSchema.parse(req.body);
      
      const artist = await storage.createArtist(artistData);
      
      await storage.logAction({
        userId,
        orgId: artistData.orgId,
        action: "CREATE_ARTIST",
        entity: "artist",
        entityId: artist.id,
        data: { name: artist.name },
      });
      
      res.json(artist);
    } catch (error) {
      console.error("Error creating artist:", error);
      res.status(500).json({ message: "Failed to create artist" });
    }
  });

  app.get('/api/organizations/:orgId/artists', isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const artists = await storage.getArtists(orgId);
      res.json(artists);
    } catch (error) {
      console.error("Error fetching artists:", error);
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  // Release routes

  app.get('/api/organizations/:orgId/releases', isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const releases = await storage.getReleases(orgId);
      res.json(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ message: "Failed to fetch releases" });
    }
  });

  app.get('/api/releases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const release = await storage.getRelease(id);
      
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      
      const tracks = await storage.getTracks(id);
      const qcItems = await storage.getQCItems(id);
      const deliveryJobs = await storage.getDeliveryJobs(id);
      
      res.json({
        ...release,
        tracks,
        qcItems,
        deliveryJobs,
      });
    } catch (error) {
      console.error("Error fetching release:", error);
      res.status(500).json({ message: "Failed to fetch release" });
    }
  });

  app.patch('/api/releases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      const { id } = req.params;
      const updates = req.body;
      
      const release = await storage.updateRelease(id, updates);
      
      await storage.logAction({
        userId,
        orgId: release.orgId,
        action: "UPDATE_RELEASE",
        entity: "release",
        entityId: id,
        data: updates,
      });
      
      res.json(release);
    } catch (error) {
      console.error("Error updating release:", error);
      res.status(500).json({ message: "Failed to update release" });
    }
  });

  app.post('/api/releases/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      const { id } = req.params;
      
      // Update release status to IN_REVIEW
      const release = await storage.updateRelease(id, { status: "IN_REVIEW" });
      
      // Create QC validation tasks
      await storage.createQCItem({
        releaseId: id,
        trackId: null,
        severity: "INFO",
        message: "Release submitted for quality control review",
        resolved: false,
      });
      
      await storage.logAction({
        userId,
        orgId: release.orgId,
        action: "SUBMIT_RELEASE",
        entity: "release",
        entityId: id,
        data: { status: "IN_REVIEW" },
      });
      
      res.json(release);
    } catch (error) {
      console.error("Error submitting release:", error);
      res.status(500).json({ message: "Failed to submit release" });
    }
  });

  // Track routes
  app.post('/api/tracks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user as AuthenticatedUser);
      const trackData = insertTrackSchema.parse(req.body);
      
      // Generate ISRC if not provided
      if (!trackData.isrc) {
        trackData.isrc = `ISRC${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      }
      
      const track = await storage.createTrack(trackData);
      
      const release = await storage.getRelease(track.releaseId);
      await storage.logAction({
        userId,
        orgId: release?.orgId || null,
        action: "CREATE_TRACK",
        entity: "track",
        entityId: track.id,
        data: { title: track.title, releaseId: track.releaseId },
      });
      
      res.json(track);
    } catch (error) {
      console.error("Error creating track:", error);
      res.status(500).json({ message: "Failed to create track" });
    }
  });

  app.get('/api/releases/:releaseId/tracks', isAuthenticated, async (req: any, res) => {
    try {
      const { releaseId } = req.params;
      const tracks = await storage.getTracks(releaseId);
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      res.status(500).json({ message: "Failed to fetch tracks" });
    }
  });

  // Split share routes
  app.post('/api/splits', isAuthenticated, async (req: any, res) => {
    try {
      const splitData = insertSplitShareSchema.parse(req.body);
      const split = await storage.createSplitShare(splitData);
      res.json(split);
    } catch (error) {
      console.error("Error creating split share:", error);
      res.status(500).json({ message: "Failed to create split share" });
    }
  });
  
  // File upload routes
  app.post('/api/upload/presign', isAuthenticated, async (req: any, res) => {
    try {
      const { filename, contentType } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ message: "Filename and content type required" });
      }
      
      // Validate file types
      const allowedAudioTypes = ['audio/wav', 'audio/flac'];
      const allowedImageTypes = ['image/jpeg', 'image/png'];
      
      if (!allowedAudioTypes.includes(contentType) && !allowedImageTypes.includes(contentType)) {
        return res.status(400).json({ message: "Invalid file type" });
      }
      
      // Import ObjectStorageService and signObjectURL function
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = filename.split('.').pop();
      const cleanFilename = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
      const uniqueFilename = `${timestamp}-${cleanFilename}.${fileExtension}`;
      
      // Determine storage path based on file type
      const isAudio = allowedAudioTypes.includes(contentType);
      const folderPath = isAudio ? "audio" : "artwork";
      
      // Use private directory for file storage
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/${folderPath}/${uniqueFilename}`;
      
      // Parse bucket and object name from path
      const parseObjectPath = (path: string) => {
        if (!path.startsWith("/")) path = `/${path}`;
        const pathParts = path.split("/");
        const bucketName = pathParts[1];
        const objectName = pathParts.slice(2).join("/");
        return { bucketName, objectName };
      };
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      
      // Generate presigned upload URL using internal method
      const request = {
        bucket_name: bucketName,
        object_name: objectName,
        method: "PUT" as const,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      };
      
      const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
      const response = await fetch(
        `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to sign object URL, errorcode: ${response.status}`);
      }
      
      const { signed_url: uploadUrl } = await response.json();
      
      // Generate download URL (will be the path in private storage)
      const downloadUrl = `/.private/${folderPath}/${uniqueFilename}`;
      
      res.json({
        uploadUrl,
        downloadUrl,
        fields: {
          key: `${folderPath}/${uniqueFilename}`,
          'Content-Type': contentType,
        },
        metadata: {
          originalFilename: filename,
          size: req.body.size || 0,
          contentType: contentType,
        }
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Reporting routes
  app.get('/api/organizations/:orgId/reports', isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { period } = req.query;
      
      const reportRows = await storage.getReportRows(orgId, period as string);
      const summary = await storage.getRevenueSummary(orgId);
      
      res.json({
        reportRows,
        summary,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Statistics routes
  app.get('/api/organizations/:orgId/stats', isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const stats = await storage.getOrgStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/organizations/:orgId/recent-releases', isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const { limit = 5 } = req.query;
      const recentReleases = await storage.getRecentReleases(orgId, Number(limit));
      res.json(recentReleases);
    } catch (error) {
      console.error("Error fetching recent releases:", error);
      res.status(500).json({ message: "Failed to fetch recent releases" });
    }
  });

  // Admin routes
  app.get('/api/admin/qc-queue', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req.user as AuthenticatedUser));
      if (user?.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const pendingReleases = await storage.getPendingQCReleases();
      res.json(pendingReleases);
    } catch (error) {
      console.error("Error fetching QC queue:", error);
      res.status(500).json({ message: "Failed to fetch QC queue" });
    }
  });

  app.post('/api/admin/releases/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req.user as AuthenticatedUser));
      if (user?.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const release = await storage.updateRelease(id, { status: "APPROVED" });
      
      // Create delivery jobs for approved release
      const deliveryTargets = ["SPOTIFY", "APPLE", "YT_MUSIC"];
      for (const target of deliveryTargets) {
        await storage.createDeliveryJob({
          releaseId: id,
          target,
          status: "PENDING",
          payload: { releaseId: id, target },
          response: null,
        });
      }
      
      await storage.logAction({
        userId: getUserId(req.user as AuthenticatedUser),
        orgId: release.orgId,
        action: "APPROVE_RELEASE",
        entity: "release",
        entityId: id,
        data: { status: "APPROVED" },
      });
      
      res.json(release);
    } catch (error) {
      console.error("Error approving release:", error);
      res.status(500).json({ message: "Failed to approve release" });
    }
  });

  app.post('/api/admin/releases/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req.user as AuthenticatedUser));
      if (user?.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { reason } = req.body;
      
      const release = await storage.updateRelease(id, { status: "REJECTED" });
      
      await storage.createQCItem({
        releaseId: id,
        trackId: null,
        severity: "ERROR",
        message: reason || "Release rejected by admin",
        resolved: false,
      });
      
      await storage.logAction({
        userId: getUserId(req.user as AuthenticatedUser),
        orgId: release.orgId,
        action: "REJECT_RELEASE",
        entity: "release",
        entityId: id,
        data: { status: "REJECTED", reason },
      });
      
      res.json(release);
    } catch (error) {
      console.error("Error rejecting release:", error);
      res.status(500).json({ message: "Failed to reject release" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
