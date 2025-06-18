import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../utils/api";
import {
  CategoryCard,
  CategoryModal,
  CategoryForm,
} from "../components/category";
import { LoadingSkeleton, EmptyState } from "../components/proposal";
import { SearchBar } from "../components/search";
import { PaginationControls } from "../components/pagination";
import { useURLParams } from "../hooks/useURLParams";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Types
interface Category {
  category_id: string;
  title: string;
  description: string;
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
  follower_count: number;
  is_following: boolean;
}

interface CategoriesResponse {
  categories: Category[];
  organization_id: string;
  organization_name: string;
  limit: number;
  offset: number;
  count: number;
}

const ITEMS_PER_PAGE = 18;

const CategoriesPage: React.FC = () => {
  // URL params for search and page state
  const { search, page, updateSearch, updatePage, clearSearch } =
    useURLParams();

  // State
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [organizationInfo, setOrganizationInfo] = useState<{
    organization_id: string;
    organization_name: string;
  } | null>(null);

  // Modal states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Search and filter categories
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return allCategories;

    const query = search.toLowerCase().trim();
    const searchTerms = query.split(/\s+/);

    return allCategories.filter((category) => {
      const title = category.title.toLowerCase();
      const description = category.description.toLowerCase();
      const creatorName =
        `${category.users.first_name} ${category.users.last_name}`.toLowerCase();
      const creatorUsername = category.users.unique_id.toLowerCase();

      return searchTerms.every(
        (term) =>
          title.includes(term) ||
          description.includes(term) ||
          creatorName.includes(term) ||
          creatorUsername.includes(term)
      );
    });
  }, [allCategories, search]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentPageCategories = filteredCategories.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Handle hash URL for opening specific category modal
  const handleHashChange = () => {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash && allCategories.length > 0) {
      const category = allCategories.find((cat) => cat.category_id === hash);
      if (category) {
        setSelectedCategory(category);
      }
    }
  };

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `${API_BASE}/api/categories/organization?limit=200&offset=0`
        );

        if (response.ok) {
          const data: CategoriesResponse = await response.json();
          setAllCategories(data.categories || []);
          setOrganizationInfo({
            organization_id: data.organization_id,
            organization_name: data.organization_name,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load categories");
        }
      } catch (err) {
        console.error("Error loading categories:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load categories"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle hash URLs after categories are loaded
  useEffect(() => {
    if (allCategories.length > 0) {
      handleHashChange();
    }
  }, [allCategories]);

  // Listen for hash changes
  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [allCategories]);

  // Auto-adjust page if out of bounds
  useEffect(() => {
    if (!loading && filteredCategories.length > 0 && page > totalPages) {
      updatePage(1);
    }
  }, [filteredCategories.length, page, totalPages, updatePage, loading]);

  // Handle category creation success
  const handleCategoryCreated = (newCategory: Category) => {
    setAllCategories((prev) => [newCategory, ...prev]);
    setShowCreateForm(false);
  };

  // Handle category card click - update hash
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    window.history.pushState(null, "", `#${category.category_id}`);
  };

  // Handle modal close - clear hash
  const handleModalClose = () => {
    setSelectedCategory(null);
    window.history.pushState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  };

  // Handle follow/unfollow
  const handleFollowToggle = async (
    categoryId: string,
    isFollowing: boolean
  ) => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await apiFetch(
        `${API_BASE}/api/categories/${categoryId}/follow`,
        { method }
      );

      if (response.ok) {
        const data = await response.json();

        // Update the category in all lists
        const updateCategory = (category: Category) => {
          if (category.category_id === categoryId) {
            return {
              ...category,
              is_following: !isFollowing,
              follower_count: data.follower_count,
            };
          }
          return category;
        };

        setAllCategories((prev) => prev.map(updateCategory));
        if (selectedCategory?.category_id === categoryId) {
          setSelectedCategory((prev) => (prev ? updateCategory(prev) : null));
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  // Determine if we should show empty state
  const showEmptyState = !loading && filteredCategories.length === 0;
  const hasFiltersApplied = search.length > 0;
  const isFilteredEmpty =
    showEmptyState && hasFiltersApplied && allCategories.length > 0;

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
            Error Loading Categories
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
              Categories
            </h1>
            <p className="text-neutral-600">
              {organizationInfo?.organization_name
                ? `Follow categories from ${organizationInfo.organization_name} to get voting suggestions`
                : "Follow categories to get voting suggestions on proposals"}
            </p>
          </div>

          {/* Create Category Button */}
          <button
            onClick={() => setShowCreateForm(true)}
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
            Create Category
          </button>
        </div>

        {/* Search Controls */}
        {!loading && allCategories.length > 0 && (
          <div className="space-y-4 mb-6">
            <SearchBar
              searchQuery={search}
              onSearchChange={updateSearch}
              onSearchClear={clearSearch}
              placeholder="Search categories by title, description, or creator..."
              resultCount={filteredCategories.length}
              entityName="categories"
            />
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : showEmptyState ? (
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
                No categories found
              </h3>
              <p className="text-neutral-600 text-center max-w-md mb-6">
                No categories match "{search}". Try adjusting your search terms.
              </p>
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            // No categories at all
            <EmptyState
              organizationName={organizationInfo?.organization_name}
              canCreateProposals={true} // Anyone can create categories
            />
          )
        ) : (
          // Categories Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPageCategories.map((category) => (
              <CategoryCard
                key={category.category_id}
                category={category}
                searchQuery={search}
                onCardClick={() => handleCategoryClick(category)}
                onFollowToggle={handleFollowToggle}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !showEmptyState && (
          <div className="mt-12">
            <PaginationControls
              currentPage={page}
              totalItems={filteredCategories.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={updatePage}
              showingCount={currentPageCategories.length}
            />
          </div>
        )}

        {/* Category Modal */}
        {selectedCategory && (
          <CategoryModal
            category={selectedCategory}
            onClose={handleModalClose}
            onFollowToggle={handleFollowToggle}
          />
        )}

        {/* Create Category Form */}
        {showCreateForm && (
          <CategoryForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCategoryCreated}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
