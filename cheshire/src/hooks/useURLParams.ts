import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortOption } from '../components/proposal/SortDropdown';
import type { FilterOption } from '../components/proposal/FilterChips';

interface URLParamsState {
  sort: SortOption;
  filter: FilterOption;
  search: string;
  page: number;
}

interface UseURLParamsReturn {
  sort: SortOption;
  filter: FilterOption;
  search: string;
  page: number;
  updateSort: (sort: SortOption) => void;
  updateFilter: (filter: FilterOption) => void;
  updateSearch: (search: string) => void;
  updatePage: (page: number) => void;
  updateParams: (params: Partial<URLParamsState>) => void;
  clearSearch: () => void;
  resetToFirstPage: () => void;
}

// Default values
const DEFAULT_SORT: SortOption = 'newest';
const DEFAULT_FILTER: FilterOption = 'all';
const DEFAULT_SEARCH = '';
const DEFAULT_PAGE = 1;

// Valid options for validation
const VALID_SORT_OPTIONS: SortOption[] = ['newest', 'oldest', 'deadline_soon', 'deadline_far'];
const VALID_FILTER_OPTIONS: FilterOption[] = ['all', 'active', 'ending_soon', 'expired'];

/**
 * Custom hook for managing sort, filter, search, and page state in URL parameters
 * Provides persistent state that survives page refreshes and allows bookmarking
 */
export const useURLParams = (): UseURLParamsReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<URLParamsState>({
    sort: DEFAULT_SORT,
    filter: DEFAULT_FILTER,
    search: DEFAULT_SEARCH,
    page: DEFAULT_PAGE,
  });
  
  // Initialize state from URL parameters on mount
  useEffect(() => {
    const sortParam = searchParams.get('sort') as SortOption;
    const filterParam = searchParams.get('filter') as FilterOption;
    const searchParam = searchParams.get('search') || '';
    const pageParam = parseInt(searchParams.get('page') || '1');
    
    const validSort = VALID_SORT_OPTIONS.includes(sortParam) ? sortParam : DEFAULT_SORT;
    const validFilter = VALID_FILTER_OPTIONS.includes(filterParam) ? filterParam : DEFAULT_FILTER;
    const validSearch = searchParam.trim();
    const validPage = pageParam >= 1 ? pageParam : DEFAULT_PAGE;
    
    setState({
      sort: validSort,
      filter: validFilter,
      search: validSearch,
      page: validPage,
    });
  }, [searchParams]);
  
  // Update URL parameters
  const updateURLParams = useCallback((newParams: Partial<URLParamsState>) => {
    setSearchParams(prevParams => {
      const updatedParams = new URLSearchParams(prevParams);
      
      // Update sort parameter
      if (newParams.sort !== undefined) {
        if (newParams.sort === DEFAULT_SORT) {
          updatedParams.delete('sort'); // Remove default values from URL
        } else {
          updatedParams.set('sort', newParams.sort);
        }
      }
      
      // Update filter parameter
      if (newParams.filter !== undefined) {
        if (newParams.filter === DEFAULT_FILTER) {
          updatedParams.delete('filter'); // Remove default values from URL
        } else {
          updatedParams.set('filter', newParams.filter);
        }
      }
      
      // Update search parameter
      if (newParams.search !== undefined) {
        const trimmedSearch = newParams.search.trim();
        if (trimmedSearch === DEFAULT_SEARCH) {
          updatedParams.delete('search'); // Remove empty search from URL
        } else {
          updatedParams.set('search', trimmedSearch);
        }
      }
      
      // Update page parameter
      if (newParams.page !== undefined) {
        if (newParams.page === DEFAULT_PAGE) {
          updatedParams.delete('page'); // Remove default page from URL
        } else {
          updatedParams.set('page', newParams.page.toString());
        }
      }
      
      return updatedParams;
    });
  }, [setSearchParams]);
  
  // Update sort parameter
  const updateSort = useCallback((sort: SortOption) => {
    setState(prev => ({ ...prev, sort, page: DEFAULT_PAGE })); // Reset to first page
    updateURLParams({ sort, page: DEFAULT_PAGE });
  }, [updateURLParams]);
  
  // Update filter parameter
  const updateFilter = useCallback((filter: FilterOption) => {
    setState(prev => ({ ...prev, filter, page: DEFAULT_PAGE })); // Reset to first page
    updateURLParams({ filter, page: DEFAULT_PAGE });
  }, [updateURLParams]);
  
  // Update search parameter
  const updateSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search, page: DEFAULT_PAGE })); // Reset to first page
    updateURLParams({ search, page: DEFAULT_PAGE });
  }, [updateURLParams]);
  
  // Update page parameter
  const updatePage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
    updateURLParams({ page });
  }, [updateURLParams]);
  
  // Clear search (convenience method)
  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, search: DEFAULT_SEARCH, page: DEFAULT_PAGE }));
    updateURLParams({ search: DEFAULT_SEARCH, page: DEFAULT_PAGE });
  }, [updateURLParams]);
  
  // Reset to first page (convenience method)
  const resetToFirstPage = useCallback(() => {
    setState(prev => ({ ...prev, page: DEFAULT_PAGE }));
    updateURLParams({ page: DEFAULT_PAGE });
  }, [updateURLParams]);
  
  // Update multiple parameters at once
  const updateParams = useCallback((params: Partial<URLParamsState>) => {
    setState(prev => ({ ...prev, ...params }));
    updateURLParams(params);
  }, [updateURLParams]);
  
  return {
    sort: state.sort,
    filter: state.filter,
    search: state.search,
    page: state.page,
    updateSort,
    updateFilter,
    updateSearch,
    updatePage,
    updateParams,
    clearSearch,
    resetToFirstPage,
  };
};