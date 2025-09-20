import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

// Whitelist of allowed emails for testing during development
  const ADMIN_EMAILS = [
    "muzika.ua.info@gmail.com", // Адміністратор
    "strisleckiipasha1308@gmail.com", // Тестувальник з правами адміністратора
];

const ALLOWED_TEST_EMAILS = [...ADMIN_EMAILS];

// Function to check if email is whitelisted and determine role
const checkEmailAccess = (email: string) => {
  const lowercaseEmail = email.toLowerCase();
  
  if (!ALLOWED_TEST_EMAILS.includes(lowercaseEmail)) {
    return { allowed: false, role: null };
  }
  
  // Set admin role if email is in admin list
  const role = ADMIN_EMAILS.includes(lowercaseEmail) ? "ADMIN" : "USER";
  
  return { allowed: true, role };
};

// Google OAuth Configuration
const setupGoogleAuth = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    return false;
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Extract user info from Google profile
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const profileImageUrl = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error("No email found in Google profile"), undefined);
      }

      // Check if email is whitelisted for testing
      const emailAccess = checkEmailAccess(email);
      if (!emailAccess.allowed) {
        console.log(`Access denied for email: ${email} - not in whitelist`);
        return done(new Error(`Access denied. Email ${email} is not authorized for testing.`), undefined);
      }

      // Check if user exists by Google ID or email
      let user = await storage.getUserByGoogleId(googleId);
      
      if (!user) {
        // Check by email in case user exists but hasn't linked Google yet
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Link Google account to existing user
          user = await storage.linkGoogleAccount(user.id, googleId);
        } else {
          // Create new user with role based on email
          user = await storage.createUserFromGoogle({
            googleId,
            email,
            firstName,
            lastName,
            profileImageUrl,
            role: emailAccess.role === "ADMIN" ? "ADMIN" : "ARTIST",
          });
        }
      }

      return done(null, user);
    } catch (error) {
      console.error("Error in Google OAuth:", error);
      return done(error, undefined);
    }
  }));

  return true;
};

export const setupGoogleAuthRoutes = (app: Express) => {
  const isConfigured = setupGoogleAuth();
  
  if (!isConfigured) {
    return;
  }


  // Google OAuth вхід (базові права)
  app.get("/auth/google",
    passport.authenticate("google", { 
      scope: ["profile", "email"] 
    })
  );

  app.get("/auth/google/callback",
    passport.authenticate("google", { 
      failureRedirect: "/?error=access_denied&message=Email+not+authorized" 
    }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );

  // Google logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      // Clear the session and send success response
      res.json({ success: true });
    });
  });
};

export const isGoogleAuthConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};