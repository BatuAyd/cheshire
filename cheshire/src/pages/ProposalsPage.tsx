import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import ProposalCard from "../components/proposal/ProposalCard";
import LoadingSkeleton from "../components/proposal/LoadingSkeleton";
import EmptyState from "../components/proposal/EmptyState";
import SortDropdown from "../components/proposal/SortDropdown";
import FilterChips from "../components/proposal/FilterChips";
import SearchBar from "../components/search/SearchBar";
import PaginationControls from "../components/pagination/PaginationControls";
import { useURLParams } from "../hooks/useURLParams";
import {
  processProposals,
  calculateFilterCounts,
  paginateItems,
  calculatePagination,
  ITEMS_PER_PAGE,
} from "../utils/proposalUtils";
import type { Proposal } from "../utils/proposalUtils";

// Types
interface ProposalsResponse {
  proposals: Proposal[];
  organization_id: string;
  limit: number;
  offset: number;
  count: number;
}

interface CanCreateResponse {
  can_create: boolean;
  organization_id: string | null;
  organization_name: string | null;
}

const ProposalsPage: React.FC = () => {
  const navigate = useNavigate();

  // URL params for sort, filter, search, and page state
  const {
    sort,
    filter,
    search,
    page,
    updateSort,
    updateFilter,
    updateSearch,
    updatePage,
    clearSearch,
  } = useURLParams();

  // State
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [organizationInfo, setOrganizationInfo] =
    useState<CanCreateResponse | null>(null);

  // Processed proposals (searched, filtered, and sorted)
  const processedProposals = useMemo(() => {
    return processProposals(allProposals, search, filter, sort);
  }, [allProposals, search, filter, sort]);

  // Pagination calculations
  const paginationInfo = useMemo(() => {
    return calculatePagination(processedProposals.length, page, ITEMS_PER_PAGE);
  }, [processedProposals.length, page]);

  // Current page items
  const currentPageProposals = useMemo(() => {
    return paginateItems(processedProposals, page, ITEMS_PER_PAGE);
  }, [processedProposals, page]);

  // Filter counts for chip badges (based on all proposals, not search results)
  const filterCounts = useMemo(() => {
    return calculateFilterCounts(allProposals);
  }, [allProposals]);

  // Load organization info and proposals
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Load more proposals to support pagination properly
        // We'll load enough to show multiple pages
        const [proposalsResponse, canCreateResponse] = await Promise.all([
          apiFetch(
            "http://localhost:8080/api/proposals/organization?limit=200&offset=0"
          ),
          apiFetch("http://localhost:8080/api/proposals/can-create"),
        ]);

        // Handle proposals response
        if (proposalsResponse.ok) {
          const proposalsData: ProposalsResponse =
            await proposalsResponse.json();
          setAllProposals(proposalsData.proposals || []);
        } else {
          const proposalsError = await proposalsResponse.json();
          throw new Error(proposalsError.error || "Failed to load proposals");
        }

        // Handle can-create response
        if (canCreateResponse.ok) {
          const canCreateData: CanCreateResponse =
            await canCreateResponse.json();
          setOrganizationInfo(canCreateData);
        } else {
          // Don't throw error for can-create failure, just log it
          console.warn("Failed to load organization info");
        }
      } catch (err) {
        console.error("Error loading proposals:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load proposals"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-adjust page if current page is out of bounds
  useEffect(() => {
    if (
      !loading &&
      processedProposals.length > 0 &&
      page > paginationInfo.totalPages
    ) {
      updatePage(1);
    }
  }, [
    processedProposals.length,
    page,
    paginationInfo.totalPages,
    updatePage,
    loading,
  ]);

  const handleCreateProposal = () => {
    navigate("/create-proposal");
  };

  // Determine if we should show empty state
  const showEmptyState = !loading && processedProposals.length === 0;
  const hasFiltersApplied =
    filter !== "all" || sort !== "newest" || search.length > 0;
  const isFilteredEmpty =
    showEmptyState && hasFiltersApplied && allProposals.length > 0;

  // Clear all filters and search
  const handleClearAll = () => {
    updateFilter("all");
    updateSort("newest");
    clearSearch();
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Error Loading Proposals
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              Proposals
            </h1>
            <p className="text-neutral-600">
              {organizationInfo?.organization_name
                ? `Active and past proposals for ${organizationInfo.organization_name}`
                : "Active and past proposals for your organization"}
            </p>
          </div>

          {/* Create Proposal Button */}
          {organizationInfo?.can_create && (
            <button
              onClick={handleCreateProposal}
              className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-orange-400 text-white rounded-lg font-medium transition-all hover:bg-orange-500 hover:shadow-md active:scale-95 gap-2 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Proposal
            </button>
          )}
        </div>

        {/* Search, Sort and Filter Controls */}
        {!loading && allProposals.length > 0 && (
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div>
              <SearchBar
                searchQuery={search}
                onSearchChange={updateSearch}
                onSearchClear={clearSearch}
                placeholder="Search proposals by title, description, or creator..."
                resultCount={processedProposals.length}
                entityName="proposals"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Filter Chips */}
              <div>
                <FilterChips
                  currentFilter={filter}
                  onFilterChange={updateFilter}
                  proposalCounts={filterCounts}
                />
              </div>

              {/* Sort Dropdown */}
              <div>
                <SortDropdown
                  currentSort={sort}
                  onSortChange={updateSort}
                  proposalCount={processedProposals.length}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          // Loading State - 18 skeleton cards
          <LoadingSkeleton />
        ) : showEmptyState ? (
          // Empty State - different messages for filtered vs no proposals
          isFilteredEmpty ? (
            // Filtered empty state
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                No proposals found
              </h3>
              <p className="text-neutral-600 text-center max-w-md mb-6">
                {search
                  ? `No proposals match "${search}" with the current filters.`
                  : "No proposals match your current filters."}{" "}
                Try adjusting your search terms, filters, or sort options.
              </p>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            // No proposals at all
            <EmptyState
              organizationName={
                organizationInfo?.organization_name || undefined
              }
              canCreateProposals={organizationInfo?.can_create || false}
            />
          )
        ) : (
          // Proposals Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPageProposals.map((proposal) => (
              <ProposalCard
                key={proposal.proposal_id}
                proposal={proposal}
                searchQuery={search}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !showEmptyState && (
          <div className="mt-12">
            <PaginationControls
              currentPage={paginationInfo.currentPage}
              totalItems={processedProposals.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={updatePage}
              showingCount={currentPageProposals.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsPage;
