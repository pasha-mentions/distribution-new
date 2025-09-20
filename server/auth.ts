import type { RequestHandler } from "express";

// Universal authentication middleware that supports both Replit Auth and Google OAuth
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check if user is authenticated via Passport
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // If this is a Replit Auth user (has claims), check token expiration
  if (user.claims && user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    
    // If token is still valid, proceed
    if (now <= user.expires_at) {
      return next();
    }

    // Try to refresh token for Replit Auth users
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Import here to avoid circular dependencies
      const { getOidcConfig } = await import("./replitAuth");
      const client = await import("openid-client");
      
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      
      // Update user session with new tokens
      user.claims = tokenResponse.claims();
      user.access_token = tokenResponse.access_token;
      user.refresh_token = tokenResponse.refresh_token;
      user.expires_at = user.claims?.exp;
      
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // For Google OAuth users or other types, just check if they're authenticated
  // (Passport.js handles session management for us)
  return next();
};