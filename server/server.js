import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { SiweMessage, generateNonce } from "siwe";
import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ================ REDIS SETUP ================

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
});

// Redis error handling
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
  console.error('Cannot start server without Redis connection');
  process.exit(1);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('ready', () => {
  console.log('✅ Redis client ready');
});

// Connect to Redis
try {
  await redis.connect();
} catch (error) {
  console.error('❌ Failed to connect to Redis:', error);
  console.error('Make sure Redis is running: brew services start redis');
  process.exit(1);
}

// ================ MIDDLEWARE SETUP ================

// Set up CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ================ SESSION HELPERS ================

const SESSION_TTL = parseInt(process.env.SESSION_TTL) || 129600; // 36 hours

/**
 * Store session in Redis with TTL
 */
const createSession = async (sessionToken, sessionData) => {
  try {
    await redis.setEx(
      `session:${sessionToken}`, 
      SESSION_TTL, 
      JSON.stringify(sessionData)
    );
    return true;
  } catch (error) {
    console.error('Failed to create session:', error);
    return false;
  }
};

/**
 * Get session from Redis
 */
const getSession = async (sessionToken) => {
  try {
    const sessionData = await redis.get(`session:${sessionToken}`);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

/**
 * Delete session from Redis
 */
const deleteSession = async (sessionToken) => {
  try {
    await redis.del(`session:${sessionToken}`);
    return true;
  } catch (error) {
    console.error('Failed to delete session:', error);
    return false;
  }
};

// ================ API ENDPOINTS ================

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Authentication server with Redis is running");
});

// Generate a nonce for message signing
app.get("/api/nonce", (req, res) => {
  try {
    const nonce = generateNonce();
    console.log("Generated nonce for authentication");
    res.status(200).json({ nonce });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

// Get current user session
app.get("/api/me", async (req, res) => {
  try {
    const sessionToken = req.cookies.auth_token;
    
    if (!sessionToken) {
      return res.status(200).json({ authenticated: false });
    }
    
    const sessionData = await getSession(sessionToken);
    
    if (!sessionData) {
      // Session expired or doesn't exist
      res.clearCookie('auth_token');
      return res.status(200).json({ authenticated: false });
    }
    
    return res.status(200).json({ 
      authenticated: true, 
      address: sessionData.address 
    });
  } catch (error) {
    console.error("Error checking authentication:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify signature and create session
app.post("/api/verify", async (req, res) => {
  const { message, signature } = req.body;
  
  if (!message || !signature) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing message or signature" 
    });
  }
  
  try {
    // Extract address from the message
    const addressMatch = message.match(/Address: (0x[a-fA-F0-9]{40})/);
    
    if (!addressMatch || !addressMatch[1]) {
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid message format - could not extract address" 
      });
    }
    
    const address = addressMatch[1];
    
    // Create a session token
    const sessionToken = generateNonce();
    
    // Store session data in Redis
    const sessionData = { 
      address,
      issuedAt: new Date().toISOString()
    };
    
    const sessionCreated = await createSession(sessionToken, sessionData);
    
    if (!sessionCreated) {
      return res.status(500).json({ 
        ok: false, 
        error: "Failed to create session" 
      });
    }
    
    // Set session cookie
    res.cookie('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL * 1000 // Convert to milliseconds
    });
    
    console.log(`✅ User authenticated: ${address}`);
    
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
app.post("/api/logout", async (req, res) => {
  try {
    const sessionToken = req.cookies.auth_token;
    
    if (sessionToken) {
      await deleteSession(sessionToken);
    }
    
    res.clearCookie('auth_token');
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to see Redis stats
app.get("/api/debug/redis", async (req, res) => {
  try {
    const info = await redis.info('memory');
    const dbSize = await redis.dbSize();
    
    res.status(200).json({ 
      connected: redis.isOpen,
      database_keys: dbSize,
      memory_info: info
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================ GRACEFUL SHUTDOWN ================

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

// ================ START SERVER ================

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Authentication server running on port ${PORT}`);
  console.log(`📡 CORS configured for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log(`⏰ Session TTL: ${SESSION_TTL} seconds (${SESSION_TTL/3600} hours)`);
});