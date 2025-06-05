import express from 'express';
import { proposalDb, userDb } from '../database/supabase.js';

const router = express.Router();

// ================ HELPER FUNCTIONS ================

/**
 * Get session from Redis (reuse from userRoutes.js logic)
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

/**
 * Validate proposal data
 */
const validateProposalData = (data) => {
  const errors = [];
  
  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required');
  } else {
    const trimmedTitle = data.title.trim();
    if (trimmedTitle.length < 10) {
      errors.push('Title must be at least 10 characters');
    } else if (trimmedTitle.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
  }
  
  // Description validation
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required');
  } else {
    const trimmedDescription = data.description.trim();
    if (trimmedDescription.length < 50) {
      errors.push('Description must be at least 50 characters');
    } else if (trimmedDescription.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
  }
  
  // Voting deadline validation
  if (!data.voting_deadline) {
    errors.push('Voting deadline is required');
  } else {
    const deadline = new Date(data.voting_deadline);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (isNaN(deadline.getTime())) {
      errors.push('Invalid voting deadline format');
    } else if (deadline <= oneHourFromNow) {
      errors.push('Voting deadline must be at least 1 hour from now');
    }
  }
  
  // Options validation
  if (!data.options || !Array.isArray(data.options)) {
    errors.push('Voting options are required');
  } else {
    const validOptions = data.options.filter(option => 
      option && typeof option === 'string' && option.trim().length >= 3
    );
    
    if (validOptions.length < 2) {
      errors.push('At least 2 voting options are required');
    } else if (validOptions.length > 10) {
      errors.push('Maximum 10 voting options allowed');
    }
    
    // Check individual option length
    data.options.forEach((option, index) => {
      if (option && typeof option === 'string') {
        const trimmed = option.trim();
        if (trimmed.length > 0 && trimmed.length < 3) {
          errors.push(`Option ${index + 1} must be at least 3 characters`);
        } else if (trimmed.length > 200) {
          errors.push(`Option ${index + 1} must be less than 200 characters`);
        }
      }
    });
    
    // Check for duplicate options
    const uniqueOptions = [...new Set(validOptions.map(opt => opt.trim().toLowerCase()))];
    if (uniqueOptions.length !== validOptions.length) {
      errors.push('Voting options must be unique');
    }
  }
  
  return errors;
};

// ================ ROUTE FACTORY ================

/**
 * Create proposal routes with Redis instance
 */
export const createProposalRoutes = (redis) => {
  // Auth middleware for this router
  const authRequired = requireAuth(redis);
  
  // ================ PROTECTED ENDPOINTS ================
  
  /**
   * Create new proposal
   * POST /api/proposals/create
   * Requires authentication and completed profile with organization
   */
  router.post('/create', authRequired, async (req, res) => {
    try {
      const { title, description, voting_deadline, options } = req.body;
      
      // Validate input data
      const validationErrors = validateProposalData({ title, description, voting_deadline, options });
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      // Get user's profile to check organization
      const user = await userDb.getByWallet(req.walletAddress);
      if (!user) {
        return res.status(404).json({ 
          error: 'User profile not found. Please complete your profile setup.' 
        });
      }
      
      if (!user.organization_id) {
        return res.status(403).json({ 
          error: 'You must be part of an organization to create proposals' 
        });
      }
      
      // Filter and clean options
      const cleanOptions = options
        .filter(option => option && typeof option === 'string' && option.trim().length >= 3)
        .map(option => option.trim());
      
      // Create proposal data
      const proposalData = {
        title: title.trim(),
        description: description.trim(),
        voting_deadline,
        organization_id: user.organization_id,
        created_by: req.walletAddress,
        options: cleanOptions
      };
      
      // Create the proposal
      const newProposal = await proposalDb.create(proposalData);
      
      console.log(`✅ Proposal created: "${newProposal.title}" with ${newProposal.options.length} options by ${user.unique_id} (${req.walletAddress})`);
      
      res.status(201).json({ 
        success: true,
        proposal: newProposal,
        message: 'Proposal created successfully'
      });
      
    } catch (error) {
      console.error('Error creating proposal:', error);
      
      // Handle specific database errors
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({ 
          error: 'A proposal with this title already exists in your organization' 
        });
      }
      
      if (error.code === '23514') { // PostgreSQL check constraint violation
        if (error.message.includes('voting_deadline_future')) {
          return res.status(400).json({ 
            error: 'Voting deadline must be at least 1 hour from now' 
          });
        }
        if (error.message.includes('title')) {
          return res.status(400).json({ 
            error: 'Title must be between 10 and 100 characters' 
          });
        }
        if (error.message.includes('description')) {
          return res.status(400).json({ 
            error: 'Description must be between 50 and 1000 characters' 
          });
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to create proposal' 
      });
    }
  });
  
  /**
   * Get user's proposals
   * GET /api/proposals/my-proposals?limit=20&offset=0
   * Requires authentication
   */
  router.get('/my-proposals', authRequired, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);
      
      const proposals = await proposalDb.getByUser(req.walletAddress, limit, offset);
      
      res.status(200).json({ 
        proposals,
        limit,
        offset,
        count: proposals.length
      });
      
    } catch (error) {
      console.error('Error getting user proposals:', error);
      res.status(500).json({ 
        error: 'Failed to get proposals' 
      });
    }
  });
  
  /**
   * Get organization proposals
   * GET /api/proposals/organization?limit=20&offset=0
   * Requires authentication
   */
  router.get('/organization', authRequired, async (req, res) => {
    try {
      // Get user's organization
      const user = await userDb.getByWallet(req.walletAddress);
      if (!user || !user.organization_id) {
        return res.status(403).json({ 
          error: 'You must be part of an organization to view proposals' 
        });
      }
      
      const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);
      
      const proposals = await proposalDb.getByOrganization(user.organization_id, limit, offset);
      
      res.status(200).json({ 
        proposals,
        organization_id: user.organization_id,
        limit,
        offset,
        count: proposals.length
      });
      
    } catch (error) {
      console.error('Error getting organization proposals:', error);
      res.status(500).json({ 
        error: 'Failed to get organization proposals' 
      });
    }
  });
  
  /**
   * Check if user can create proposals
   * GET /api/proposals/can-create
   * Requires authentication
   */
  router.get('/can-create', authRequired, async (req, res) => {
    try {
      const canCreate = await proposalDb.canUserCreateProposal(req.walletAddress);
      const user = await userDb.getByWallet(req.walletAddress);
      
      res.status(200).json({ 
        can_create: canCreate,
        organization_id: user?.organization_id || null,
        organization_name: user?.organizations?.organization_name || null
      });
      
    } catch (error) {
      console.error('Error checking if user can create proposals:', error);
      res.status(500).json({ 
        error: 'Failed to check proposal creation permissions' 
      });
    }
  });
  
  return router;
};

export default createProposalRoutes;