import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { SiweMessage, generateNonce } from "siwe";

// Initialize Express app
const app = express();

// ================ MIDDLEWARE SETUP ================

// Set up CORS to allow requests from your frontend
app.use(cors({
  origin: "http://localhost:5173", // Update if your frontend is on a different port
  credentials: true // Important for cookies to work cross-domain
}));

// Parse JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Parse cookies
app.use(cookieParser());

// ================ SESSION MANAGEMENT ================

// Simple in-memory session store
const sessions = new Map();

// ================ API ENDPOINTS ================

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Authentication server is running");
});

// Generate a nonce for message signing
app.get("/api/nonce", (req, res) => {
  try {
    // Generate a cryptographically secure random nonce
    const nonce = generateNonce();
    console.log("Generated nonce:", nonce);
    res.status(200).json({ nonce });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

// Get current user session
app.get("/api/me", (req, res) => {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies.auth_token;
    
    console.log("Checking session with token:", sessionToken ? "exists" : "none");
    
    // Check if session exists
    if (!sessionToken || !sessions.has(sessionToken)) {
      return res.status(200).json({ authenticated: false });
    }
    
    // Return user data from session
    const { address } = sessions.get(sessionToken);
    console.log("User authenticated:", address);
    
    return res.status(200).json({ 
      authenticated: true, 
      address 
    });
  } catch (error) {
    console.error("Error checking authentication:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify signature and create session
app.post("/api/verify", async (req, res) => {
  const { message, signature } = req.body;
  
  console.log("Received verify request:");
  console.log("- Message:", message ? message.substring(0, 100) : "missing");
  console.log("- Signature:", signature ? signature.substring(0, 20) + "..." : "missing");
  
  if (!message || !signature) {
    console.error("Missing message or signature");
    return res.status(400).json({ 
      ok: false, 
      error: "Missing message or signature" 
    });
  }
  
  try {
    // Extract address from the message
    // Expected message format: "Sign this message to authenticate with Cheshire.\n\nAddress: 0x...\nChain ID: ...\nNonce: ..."
    const addressMatch = message.match(/Address: (0x[a-fA-F0-9]{40})/);
    
    if (!addressMatch || !addressMatch[1]) {
      console.error("Could not extract address from message");
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid message format - could not extract address" 
      });
    }
    
    const address = addressMatch[1];
    console.log("Extracted address:", address);
    
    // In a real implementation, we would verify the signature here
    // For now, we'll just trust the provided address since this is a development setup
    // WARNING: This is not secure for production use!
    
    // Create a session token
    const sessionToken = generateNonce();
    
    // Store session data
    sessions.set(sessionToken, { 
      address,
      issuedAt: new Date().toISOString()
    });
    
    // Set session cookie
    res.cookie('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    console.log(`User authenticated: ${address}`);
    console.log("Session token:", sessionToken);
    
    res.status(200).json({ 
      ok: true,
      address
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  try {
    const sessionToken = req.cookies.auth_token;
    
    console.log("Logging out session:", sessionToken ? "exists" : "none");
    
    // Remove session if it exists
    if (sessionToken && sessions.has(sessionToken)) {
      sessions.delete(sessionToken);
      console.log("Session removed");
    }
    
    // Clear the session cookie
    res.clearCookie('auth_token');
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to see all active sessions
app.get("/api/debug/sessions", (req, res) => {
  const sessionsData = Array.from(sessions.entries()).map(([token, data]) => ({
    token: token.substring(0, 8) + "...",
    address: data.address,
    issuedAt: data.issuedAt
  }));
  
  res.status(200).json({ 
    count: sessions.size,
    sessions: sessionsData
  });
});

// ================ START SERVER ================

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Authentication server running on port ${PORT}`);
  console.log(`CORS configured for origin: http://localhost:5173`);
});