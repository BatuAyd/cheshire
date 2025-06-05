import React, { useState, useRef, useEffect } from "react";

// Sort options configuration
export const SORT_OPTIONS = {
  newest: { label: "Newest First", value: "newest" },
  oldest: { label: "Oldest First", value: "oldest" },
  deadline_soon: { label: "Deadline Soon", value: "deadline_soon" },
  deadline_far: { label: "Deadline Far", value: "deadline_far" },
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  proposalCount?: number;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  currentSort,
  onSortChange,
  proposalCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSortSelect = (sortOption: SortOption) => {
    onSortChange(sortOption);
    setIsOpen(false);
  };

  const currentLabel = SORT_OPTIONS[currentSort].label;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Sort Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Sort proposals. Currently sorted by ${currentLabel}`}
      >
        {/* Sort Icon */}
        <svg
          className="w-4 h-4 text-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>

        <span>Sort: {currentLabel}</span>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
          <div className="py-1" role="listbox">
            {Object.entries(SORT_OPTIONS).map(([key, option]) => (
              <button
                key={key}
                onClick={() => handleSortSelect(key as SortOption)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 transition-colors ${
                  currentSort === key
                    ? "bg-orange-50 text-orange-700 font-medium"
                    : "text-neutral-700"
                }`}
                role="option"
                aria-selected={currentSort === key}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {currentSort === key && (
                    <svg
                      className="w-4 h-4 text-orange-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Results count footer */}
          {proposalCount > 0 && (
            <div className="border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
              {proposalCount} proposal{proposalCount === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
