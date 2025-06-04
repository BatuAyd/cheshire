import { useState, useEffect, useCallback } from 'react';

// Types
interface Organization {
  organization_id: string;
  organization_name: string;
}

interface UserProfileData {
  wallet_address: string;
  unique_id: string;
  first_name: string;
  last_name: string;
  organization_id?: string;
  organizations?: {
    organization_name: string;
  };
  created_at: string;
}

interface ValidationResult {
  valid: boolean;
  message: string;
}

interface UniqueIdCheck {
  available: boolean;
  checking: boolean;
  message: string;
}

interface OrganizationCheck {
  exists: boolean;
  checking: boolean;
  message: string;
}

// Custom hook for user profile management
export const useUserProfile = () => {
  // ================ STATE ================
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  
  const [uniqueIdCheck, setUniqueIdCheck] = useState<UniqueIdCheck>({
    available: false,
    checking: false,
    message: ''
  });
  
  const [organizationCheck, setOrganizationCheck] = useState<OrganizationCheck>({
    exists: false,
    checking: false,
    message: ''
  });
  
  const [creatingUser, setCreatingUser] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  
  // ================ VALIDATION HELPERS ================
  
  /**
   * Validate unique_id format
   */
  const validateUniqueIdFormat = useCallback((uniqueId: string): ValidationResult => {
    if (!uniqueId) {
      return { valid: false, message: 'Unique ID is required' };
    }
    
    if (uniqueId.length > 16) {
      return { valid: false, message: 'Maximum 16 characters allowed' };
    }
    
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(uniqueId)) {
      return { valid: false, message: 'Only letters, numbers, and underscores allowed' };
    }
    
    return { valid: true, message: '' };
  }, []);
  
  /**
   * Validate name fields
   */
  const validateName = useCallback((name: string, fieldName: string): ValidationResult => {
    if (!name.trim()) {
      return { valid: false, message: `${fieldName} is required` };
    }
    
    if (name.trim().length < 2) {
      return { valid: false, message: `${fieldName} must be at least 2 characters` };
    }
    
    if (name.trim().length > 50) {
      return { valid: false, message: `${fieldName} must be less than 50 characters` };
    }
    
    return { valid: true, message: '' };
  }, []);
  
  // ================ API FUNCTIONS ================
  
  /**
   * Load all available organizations
   */
  const loadOrganizations = useCallback(async () => {
    if (loadingOrganizations) return; // Prevent multiple calls
    
    try {
      setLoadingOrganizations(true);
      
      const response = await fetch('http://localhost:8080/api/user/organizations');
      const data = await response.json();
      
      if (response.ok) {
        setOrganizations(data.organizations || []);
      } else {
        console.error('Failed to load organizations:', data.error);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoadingOrganizations(false);
    }
  }, [loadingOrganizations]);
  
  /**
   * Check if unique_id is available with debouncing
   */
  const checkUniqueIdAvailability = useCallback(async (uniqueId: string) => {
    // First validate format
    const formatValidation = validateUniqueIdFormat(uniqueId);
    if (!formatValidation.valid) {
      setUniqueIdCheck({
        available: false,
        checking: false,
        message: formatValidation.message
      });
      return;
    }
    
    try {
      setUniqueIdCheck(prev => ({ ...prev, checking: true }));
      
      const response = await fetch(
        `http://localhost:8080/api/user/unique-id/check?id=${encodeURIComponent(uniqueId)}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setUniqueIdCheck({
          available: data.available,
          checking: false,
          message: data.available ? 'Available!' : 'Already taken'
        });
      } else {
        setUniqueIdCheck({
          available: false,
          checking: false,
          message: data.error || 'Error checking availability'
        });
      }
    } catch (error) {
      console.error('Error checking unique_id:', error);
      setUniqueIdCheck({
        available: false,
        checking: false,
        message: 'Error checking availability'
      });
    }
  }, [validateUniqueIdFormat]);
  
  /**
   * Check if organization exists
   */
  const checkOrganizationExists = useCallback(async (organizationId: string) => {
    if (!organizationId.trim()) {
      setOrganizationCheck({
        exists: false,
        checking: false,
        message: ''
      });
      return;
    }
    
    try {
      setOrganizationCheck(prev => ({ ...prev, checking: true }));
      
      const response = await fetch(
        `http://localhost:8080/api/user/organization/check?id=${encodeURIComponent(organizationId)}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setOrganizationCheck({
          exists: data.exists,
          checking: false,
          message: data.exists ? 'Organization found' : 'Organization not found'
        });
      } else {
        setOrganizationCheck({
          exists: false,
          checking: false,
          message: data.error || 'Error checking organization'
        });
      }
    } catch (error) {
      console.error('Error checking organization:', error);
      setOrganizationCheck({
        exists: false,
        checking: false,
        message: 'Error checking organization'
      });
    }
  }, []);
  
  /**
   * Create new user profile
   */
  const createUserProfile = useCallback(async (profileData: {
    unique_id: string;
    first_name: string;
    last_name: string;
    organization_id?: string;
  }) => {
    try {
      setCreatingUser(true);
      
      const response = await fetch('http://localhost:8080/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include auth cookies
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ User profile created successfully');
        return { success: true, user: data.user };
      } else {
        console.error('❌ Failed to create user profile:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setCreatingUser(false);
    }
  }, []);
  
  /**
   * Get current user profile
   */
  const getUserProfile = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/user/profile', {
        credentials: 'include', // Include auth cookies
      });
      
      const data = await response.json();
      
      if (response.ok && data.exists) {
        setUserProfile(data.user);
        return { success: true, user: data.user };
      } else {
        setUserProfile(null);
        return { success: false, exists: false };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      setUserProfile(null);
      return { success: false, error: 'Network error occurred' };
    }
  }, []);
  
  /**
   * Check if user exists by wallet address
   */
  const checkUserExists = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/user/exists?address=${encodeURIComponent(walletAddress)}`
      );
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, exists: data.exists };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }, []);
  
  // ================ EFFECTS ================
  
  // Load organizations on hook initialization - ONLY ONCE
  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      if (organizations.length === 0 && !loadingOrganizations && mounted) {
        await loadOrganizations();
      }
    };
    
    load();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once
  
  // ================ RETURN INTERFACE ================
  
  return {
    // State
    organizations,
    loadingOrganizations,
    uniqueIdCheck,
    organizationCheck,
    creatingUser,
    userProfile,
    
    // Validation functions
    validateUniqueIdFormat,
    validateName,
    
    // API functions
    loadOrganizations,
    checkUniqueIdAvailability,
    checkOrganizationExists,
    createUserProfile,
    getUserProfile,
    checkUserExists,
  };
};