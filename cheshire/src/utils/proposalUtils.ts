import type { SortOption } from '../components/proposal/SortDropdown';
import type { FilterOption } from '../components/proposal/FilterChips';

// Proposal interface (shared with components)
interface ProposalOption {
  option_number: number;
  option_text: string;
}

interface Proposal {
  proposal_id: string;
  title: string;
  description: string;
  voting_deadline: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  organizations: {
    organization_name: string;
  };
  users: {
    unique_id: string;
    first_name: string;
    last_name: string;
  };
  options?: ProposalOption[];
}

// Pagination configuration
export const ITEMS_PER_PAGE = 18;

// Pagination helper types
export interface PaginationInfo {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

// Status calculation (moved from ProposalCard for reusability)
export const getProposalStatus = (voting_deadline: string): 'ACTIVE' | 'ENDING SOON' | 'EXPIRED' => {
  const now = new Date();
  const deadline = new Date(voting_deadline);
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursLeft < 0) return 'EXPIRED';
  if (hoursLeft < 24) return 'ENDING SOON';
  return 'ACTIVE';
};

/**
 * Search proposals based on search query
 * Searches across title, description, and creator username
 */
export const searchProposals = (proposals: Proposal[], searchQuery: string): Proposal[] => {
  if (!searchQuery.trim()) return proposals;
  
  const query = searchQuery.toLowerCase().trim();
  const searchTerms = query.split(/\s+/); // Split by whitespace for multiple terms
  
  return proposals.filter(proposal => {
    // Searchable fields
    const title = proposal.title.toLowerCase();
    const description = proposal.description.toLowerCase();
    const creatorUsername = proposal.users.unique_id.toLowerCase();
    const creatorFullName = `${proposal.users.first_name} ${proposal.users.last_name}`.toLowerCase();
    
    // Check if all search terms are found in any of the searchable fields
    return searchTerms.every(term => 
      title.includes(term) ||
      description.includes(term) ||
      creatorUsername.includes(term) ||
      creatorFullName.includes(term)
    );
  });
};

/**
 * Filter proposals based on filter option
 */
export const filterProposals = (proposals: Proposal[], filter: FilterOption): Proposal[] => {
  if (filter === 'all') return proposals;
  
  return proposals.filter(proposal => {
    const status = getProposalStatus(proposal.voting_deadline);
    
    switch (filter) {
      case 'active':
        // Active filter includes both ACTIVE and ENDING SOON (still open for voting)
        return status === 'ACTIVE' || status === 'ENDING SOON';
      case 'ending_soon':
        return status === 'ENDING SOON';
      case 'expired':
        return status === 'EXPIRED';
      default:
        return true;
    }
  });
};

/**
 * Sort proposals based on sort option
 */
export const sortProposals = (proposals: Proposal[], sort: SortOption): Proposal[] => {
  const sortedProposals = [...proposals]; // Don't mutate original array
  
  switch (sort) {
    case 'newest':
      return sortedProposals.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
    case 'oldest':
      return sortedProposals.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
    case 'deadline_soon':
      return sortedProposals.sort((a, b) => {
        const aDeadline = new Date(a.voting_deadline).getTime();
        const bDeadline = new Date(b.voting_deadline).getTime();
        const now = Date.now();
        
        // Put expired proposals at the end
        const aExpired = aDeadline < now;
        const bExpired = bDeadline < now;
        
        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;
        if (aExpired && bExpired) {
          // Both expired: sort by most recently expired first
          return bDeadline - aDeadline;
        }
        
        // Both active: sort by soonest deadline first
        return aDeadline - bDeadline;
      });
      
    case 'deadline_far':
      return sortedProposals.sort((a, b) => {
        const aDeadline = new Date(a.voting_deadline).getTime();
        const bDeadline = new Date(b.voting_deadline).getTime();
        const now = Date.now();
        
        // Put expired proposals at the end
        const aExpired = aDeadline < now;
        const bExpired = bDeadline < now;
        
        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;
        if (aExpired && bExpired) {
          // Both expired: sort by least recently expired first
          return aDeadline - bDeadline;
        }
        
        // Both active: sort by furthest deadline first
        return bDeadline - aDeadline;
      });
      
    default:
      return sortedProposals;
  }
};

/**
 * Apply search, filtering, and sorting to proposals
 */
export const processProposals = (
  proposals: Proposal[], 
  searchQuery: string,
  filter: FilterOption, 
  sort: SortOption
): Proposal[] => {
  // Apply search first
  const searched = searchProposals(proposals, searchQuery);
  
  // Then apply filtering
  const filtered = filterProposals(searched, filter);
  
  // Finally apply sorting
  return sortProposals(filtered, sort);
};

/**
 * Paginate an array of items
 */
export const paginateItems = <T>(items: T[], page: number, itemsPerPage: number = ITEMS_PER_PAGE): T[] => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
};

/**
 * Calculate pagination information
 */
export const calculatePagination = (
  totalItems: number, 
  currentPage: number, 
  itemsPerPage: number = ITEMS_PER_PAGE
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  
  return {
    currentPage: validPage,
    totalItems,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPreviousPage: validPage > 1,
    startIndex,
    endIndex
  };
};

/**
 * Calculate API offset for server-side pagination
 */
export const calculateApiOffset = (page: number, itemsPerPage: number = ITEMS_PER_PAGE): number => {
  return (page - 1) * itemsPerPage;
};

/**
 * Calculate proposal counts for each filter option
 */
export const calculateFilterCounts = (proposals: Proposal[]): Record<FilterOption, number> => {
  const counts: Record<FilterOption, number> = {
    all: proposals.length,
    active: 0,
    ending_soon: 0,
    expired: 0,
  };
  
  let activeCount = 0;
  let endingSoonCount = 0;
  let expiredCount = 0;
  
  proposals.forEach(proposal => {
    const status = getProposalStatus(proposal.voting_deadline);
    
    switch (status) {
      case 'ACTIVE':
        activeCount++;
        break;
      case 'ENDING SOON':
        endingSoonCount++;
        break;
      case 'EXPIRED':
        expiredCount++;
        break;
    }
  });
  
  // Active filter includes both ACTIVE and ENDING SOON
  counts.active = activeCount + endingSoonCount;
  counts.ending_soon = endingSoonCount;
  counts.expired = expiredCount;
  
  return counts;
};

export type { Proposal };