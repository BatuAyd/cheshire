import React, { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  placeholder?: string;
  resultCount?: number;
  className?: string;
  entityName?: string; // e.g., "proposals", "categories", "results"
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
  placeholder = "Search...",
  resultCount,
  className = "",
  entityName = "results",
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when prop changes (for external updates)
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search - 500ms delay
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      if (localQuery !== searchQuery) {
        onSearchChange(localQuery);
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localQuery, searchQuery, onSearchChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClear = () => {
    setLocalQuery("");
    onSearchClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (localQuery) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const hasQuery = localQuery.length > 0;
  const isSearching = localQuery !== searchQuery && localQuery.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input Container */}
      <div
        className={`relative flex items-center transition-all duration-200 ${
          isFocused ? "ring-2 ring-orange-400 ring-offset-2" : ""
        }`}
      >
        <div className="relative flex-1">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className={`h-5 w-5 transition-colors ${
                isFocused || hasQuery ? "text-orange-500" : "text-neutral-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-lg 
                     bg-white text-neutral-900 placeholder-neutral-500
                     focus:outline-none focus:ring-0 focus:border-orange-400
                     hover:border-neutral-400 transition-colors"
            aria-label={`Search ${entityName}`}
          />

          {/* Loading/Clear Button */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isSearching ? (
              // Loading spinner while debouncing
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent"></div>
            ) : hasQuery ? (
              // Clear button when there's a query
              <button
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Clear search"
                title="Clear search (Esc)"
              >
                <svg
                  className="h-4 w-4 text-neutral-400 hover:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      {hasQuery && !isSearching && (
        <div className="mt-2 text-sm text-neutral-600">
          {resultCount !== undefined && (
            <span>
              {resultCount === 0
                ? `No ${entityName} found`
                : `${resultCount} ${entityName} found`}{" "}
              for "{searchQuery}"
            </span>
          )}
        </div>
      )}

      {/* Search Tips (when focused and no query) */}
      {isFocused && !hasQuery && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 z-10">
          <h4 className="text-sm font-medium text-neutral-800 mb-2">
            Search Tips:
          </h4>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li>• Search by title and description</li>
            <li>• Find by creator username</li>
            <li>• Press Esc to clear or exit search</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
