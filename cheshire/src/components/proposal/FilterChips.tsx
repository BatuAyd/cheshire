import React from "react";

// Filter options configuration
export const FILTER_OPTIONS = {
  all: { label: "All", value: "all" },
  active: { label: "Active", value: "active" },
  ending_soon: { label: "Ending Soon", value: "ending_soon" },
  expired: { label: "Expired", value: "expired" },
} as const;

export type FilterOption = keyof typeof FILTER_OPTIONS;

interface FilterChipsProps {
  currentFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  proposalCounts?: Record<FilterOption, number>;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  currentFilter,
  onFilterChange,
  proposalCounts,
}) => {
  // Get the appropriate styling for each filter chip
  const getChipStyle = (filterKey: FilterOption) => {
    const isActive = currentFilter === filterKey;
    const baseClasses =
      "px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border";

    if (isActive) {
      // Active chip styling with different colors per filter type
      switch (filterKey) {
        case "all":
          return `${baseClasses} bg-neutral-700 text-white border-neutral-700 hover:bg-neutral-800`;
        case "active":
          return `${baseClasses} bg-green-500 text-white border-green-500 hover:bg-green-600`;
        case "ending_soon":
          return `${baseClasses} bg-orange-500 text-white border-orange-500 hover:bg-orange-600`;
        case "expired":
          return `${baseClasses} bg-red-500 text-white border-red-500 hover:bg-red-600`;
        default:
          return `${baseClasses} bg-neutral-700 text-white border-neutral-700`;
      }
    } else {
      // Inactive chip styling
      return `${baseClasses} bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400`;
    }
  };

  // Get emoji icon for each filter
  const getFilterIcon = (filterKey: FilterOption) => {
    switch (filterKey) {
      case "all":
        return "📋";
      case "active":
        return "✅";
      case "ending_soon":
        return "⏰";
      case "expired":
        return "❌";
      default:
        return "📋";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(FILTER_OPTIONS).map(([key, option]) => {
        const filterKey = key as FilterOption;
        const count = proposalCounts?.[filterKey];
        const hasCount = count !== undefined;

        return (
          <button
            key={key}
            onClick={() => onFilterChange(filterKey)}
            className={getChipStyle(filterKey)}
            aria-pressed={currentFilter === filterKey}
            aria-label={`Filter by ${option.label}${
              hasCount ? `, ${count} proposals` : ""
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{getFilterIcon(filterKey)}</span>
              <span>{option.label}</span>
              {hasCount && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    currentFilter === filterKey
                      ? "bg-white/20 text-white"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
