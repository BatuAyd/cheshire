import express from 'express';
import { userDb, organizationDb } from '../database/supabase.js';

const router = express.Router();

// ================ HELPER FUNCTIONS ================

/**
 * Get session from Redis (reuse from server.js logic)
 */
const getSession = async (redis, sessionToken) => {
  try {
    const sessionData = await redis.get(`session:${sessionToken}`);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

/**
 * Middleware to verify authentication via Redis session
 */
const requireAuth = (redis) => {
  return async (req, res, next) => {
    try {
      const sessionToken = req.cookies.auth_token;
      
      if (!sessionToken) {
        return res.status(401).json({ 
          error: 'Authentication required',
          authenticated: false 
        });
      }
      
      const sessionData = await getSession(redis, sessionToken);
      
      if (!sessionData) {
        res.clearCookie('auth_token');
        return res.status(401).json({ 
          error: 'Invalid or expired session',
          authenticated: false 
        });
      }
      
      // Add session data to request for use in routes
      req.session = sessionData;
      req.walletAddress = sessionData.address;
      next();
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Authentication check failed' });
    }
  };
};

// ================ ROUTE FACTORY ================

/**
 * Create user routes with Redis instance
 */
export const createUserRoutes = (redis) => {
  // Auth middleware for this router
  const authRequired = requireAuth(redis);
  
  // ================ PUBLIC ENDPOINTS ================
  
  /**
   * Check if user exists by wallet address
   * GET /api/user/exists?address=0x123...
   * Public endpoint - no auth required
   */
  router.get('/exists', async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ 
          error: 'Wallet address is required' 
        });
      }
      
      // Validate address format (basic check)
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ 
          error: 'Invalid wallet address format' 
        });
      }
      
      const exists = await userDb.exists(address);
      
      res.status(200).json({ 
        exists,
        address: address.toLowerCase()
      });
      
    } catch (error) {
      console.error('Error checking user existence:', error);
      res.status(500).json({ 
        error: 'Failed to check user existence' 
      });
    }
  });
  
  /**
   * Check if unique_id is available
   * GET /api/user/unique-id/check?id=alice123
   * Public endpoint for form validation
   */
  router.get('/unique-id/check', async (req, res) => {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ 
          error: 'Unique ID is required' 
        });
      }
      
      // Validate unique_id format
      const uniqueIdPattern = /^[a-zA-Z0-9_]{1,16}$/;
      if (!uniqueIdPattern.test(id)) {
        return res.status(400).json({ 
          error: 'Invalid format. Use only letters, numbers, and underscores (max 16 characters)',
          available: false
        });
      }
      
      const available = await userDb.isUniqueIdAvailable(id);
      
      res.status(200).json({ 
        available,
        unique_id: id.toLowerCase()
      });
      
    } catch (error) {
      console.error('Error checking unique_id availability:', error);
      res.status(500).json({ 
        error: 'Failed to check unique ID availability' 
      });
    }
  });
  
  /**
   * Check if organization exists
   * GET /api/user/organization/check?id=bilgi_university
   * Public endpoint for form validation
   */
  router.get('/organization/check', async (req, res) => {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ 
          error: 'Organization ID is required' 
        });
      }
      
      const exists = await organizationDb.exists(id);
      
      res.status(200).json({ 
        exists,
        organization_id: id.toLowerCase()
      });
      
    } catch (error) {
      console.error('Error checking organization existence:', error);
      res.status(500).json({ 
        error: 'Failed to check organization existence' 
      });
    }
  });
  
  /**
   * Get all available organizations
   * GET /api/user/organizations
   * Public endpoint for dropdown/suggestions
   */
  router.get('/organizations', async (req, res) => {
    try {
      const organizations = await organizationDb.getAll();
      
      res.status(200).json({ 
        organizations 
      });
      
    } catch (error) {
      console.error('Error getting organizations:', error);
      res.status(500).json({ 
        error: 'Failed to get organizations' 
      });
    }
  });
  
  // ================ PROTECTED ENDPOINTS ================
  
  /**
   * Get current user profile
   * GET /api/user/profile
   * Requires authentication
   */
  router.get('/profile', authRequired, async (req, res) => {
    try {
      const user = await userDb.getByWallet(req.walletAddress);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User profile not found',
          exists: false
        });
      }
      
      res.status(200).json({ 
        user,
        exists: true
      });
      
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ 
        error: 'Failed to get user profile' 
      });
    }
  });
  
  /**
   * Create new user profile
   * POST /api/user/create
   * Requires authentication
   */
  router.post('/create', authRequired, async (req, res) => {
    try {
      const { unique_id, first_name, last_name, organization_id } = req.body;
      
      // Validate required fields
      if (!unique_id || !first_name || !last_name) {
        return res.status(400).json({ 
          error: 'Missing required fields: unique_id, first_name, last_name' 
        });
      }
      
      // Validate unique_id format
      const uniqueIdPattern = /^[a-zA-Z0-9_]{1,16}$/;
      if (!uniqueIdPattern.test(unique_id)) {
        return res.status(400).json({ 
          error: 'Invalid unique_id format. Use only letters, numbers, and underscores (max 16 characters)' 
        });
      }
      
      // Check if user already exists
      const userExists = await userDb.exists(req.walletAddress);
      if (userExists) {
        return res.status(409).json({ 
          error: 'User profile already exists for this wallet address' 
        });
      }
      
      // Check if unique_id is available
      const uniqueIdAvailable = await userDb.isUniqueIdAvailable(unique_id);
      if (!uniqueIdAvailable) {
        return res.status(409).json({ 
          error: 'Unique ID is already taken' 
        });
      }
      
      // Check if organization exists (if provided)
      if (organization_id) {
        const orgExists = await organizationDb.exists(organization_id);
        if (!orgExists) {
          return res.status(400).json({ 
            error: 'Organization does not exist' 
          });
        }
      }
      
      // Create user
      const userData = {
        walletAddress: req.walletAddress,
        uniqueId: unique_id,
        firstName: first_name,
        lastName: last_name,
        organizationId: organization_id || null
      };
      
      const newUser = await userDb.create(userData);
      
      console.log(`✅ User created: ${newUser.unique_id} (${newUser.wallet_address})`);
      
      res.status(201).json({ 
        success: true,
        user: newUser,
        message: 'User profile created successfully'
      });
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle specific database errors
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail?.includes('unique_id')) {
          return res.status(409).json({ 
            error: 'Unique ID is already taken' 
          });
        }
        if (error.detail?.includes('wallet_address')) {
          return res.status(409).json({ 
            error: 'User profile already exists for this wallet address' 
          });
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to create user profile' 
      });
    }
  });
  
  return router;
};

export default createUserRoutes;