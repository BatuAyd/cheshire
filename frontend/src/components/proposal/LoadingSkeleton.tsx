import React from "react";

// Single skeleton card component
const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-neutral-100 animate-pulse">
      {/* Status badge skeleton */}
      <div className="absolute top-2 right-2 w-16 h-5 bg-neutral-200 rounded-full"></div>

      {/* Title area with icon */}
      <div className="flex items-start gap-2 mb-3 pr-20">
        <div className="w-4 h-4 bg-neutral-200 rounded mt-1 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-5 bg-neutral-200 rounded w-4/5 mb-1"></div>
          <div className="h-5 bg-neutral-200 rounded w-3/5"></div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-neutral-200 rounded w-full"></div>
        <div className="h-4 bg-neutral-200 rounded w-full"></div>
        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
      </div>

      {/* Voting options skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-neutral-200 rounded"></div>
        <div className="h-4 bg-neutral-200 rounded w-24"></div>
      </div>

      {/* Time and creator skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-neutral-200 rounded"></div>
        <div className="h-4 bg-neutral-200 rounded w-16"></div>
        <div className="w-1 h-1 bg-neutral-200 rounded-full"></div>
        <div className="w-4 h-4 bg-neutral-200 rounded"></div>
        <div className="h-4 bg-neutral-200 rounded w-20"></div>
      </div>

      {/* Created date skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-neutral-200 rounded"></div>
        <div className="h-4 bg-neutral-200 rounded w-28"></div>
      </div>
    </div>
  );
};

// Loading skeleton component that renders 18 skeleton cards
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 18 }, (_, index) => (
        <div key={index} className="relative">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
