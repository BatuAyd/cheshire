import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showingCount: number;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  showingCount,
  className = "",
}) => {
  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Don't show pagination if there are no items at all
  if (totalItems === 0) return null;

  // Calculate visible page numbers (show up to 7 pages)
  const getVisiblePages = () => {
    const maxVisible = 7;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic for many pages
      pages.push(1);

      if (currentPage > 4) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Results Summary */}
      <div className="text-sm text-neutral-600">
        Showing {startItem}-{endItem} of {totalItems} results
        {showingCount < totalItems && (
          <span className="text-orange-500 font-medium"> (filtered)</span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            hasPrevious
              ? "text-neutral-700 hover:bg-neutral-100 hover:text-orange-500"
              : "text-neutral-400 cursor-not-allowed"
          }`}
          aria-label="Go to previous page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-neutral-400 text-sm">...</span>
              ) : (
                <button
                  onClick={() => handlePageClick(page as number)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[2.5rem] ${
                    currentPage === page
                      ? "bg-orange-500 text-white"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-orange-500"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            hasNext
              ? "text-neutral-700 hover:bg-neutral-100 hover:text-orange-500"
              : "text-neutral-400 cursor-not-allowed"
          }`}
          aria-label="Go to next page"
        >
          Next
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Mobile-friendly page info */}
      <div className="text-xs text-neutral-500 sm:hidden">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default PaginationControls;
