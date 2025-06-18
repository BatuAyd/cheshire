import React from "react";
import { TextHighlighter } from "../search";

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

interface CategoryCardProps {
  category: Category;
  searchQuery?: string;
  onCardClick: () => void;
  onFollowToggle: (categoryId: string, isFollowing: boolean) => void;
}

// Truncate description to first 40 words
const truncateDescription = (description: string, wordLimit: number = 40) => {
  const words = description.trim().split(/\s+/);
  if (words.length <= wordLimit) return description;
  return words.slice(0, wordLimit).join(" ") + "...";
};

// Format creation date
const formatCreatedDate = (created_at: string) => {
  return new Date(created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  searchQuery = "",
  onCardClick,
  onFollowToggle,
}) => {
  const truncatedDescription = truncateDescription(category.description);
  const createdDate = formatCreatedDate(category.created_at);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onFollowToggle(category.category_id, category.is_following);
  };

  return (
    <div
      onClick={onCardClick}
      className="relative bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-neutral-100 group"
    >
      {/* Follow Button - Absolute positioned top-right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleFollowClick}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            category.is_following
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
          }`}
        >
          {category.is_following ? "Following" : "Follow"}
        </button>
      </div>

      {/* Title with icon */}
      <div className="flex items-start gap-2 mb-3 pr-20">
        <span className="text-neutral-600 mt-1 flex-shrink-0">🏷️</span>
        <h3 className="text-lg font-semibold text-neutral-800 leading-tight group-hover:text-orange-600 transition-colors">
          <TextHighlighter text={category.title} searchQuery={searchQuery} />
        </h3>
      </div>

      {/* Description */}
      <p className="text-neutral-600 text-sm leading-relaxed mb-4 break-words">
        <TextHighlighter
          text={truncatedDescription}
          searchQuery={searchQuery}
        />
      </p>

      {/* Creator and follower info */}
      <div className="flex items-center gap-2 mb-2 text-sm text-neutral-600">
        <span>👤</span>
        <span>
          <TextHighlighter
            text={category.users.unique_id}
            searchQuery={searchQuery}
          />
        </span>
        <span>•</span>
        <span>👥</span>
        <span>
          {category.follower_count} follower
          {category.follower_count === 1 ? "" : "s"}
        </span>
      </div>

      {/* Created date */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span>📅</span>
        <span>Created {createdDate}</span>
      </div>
    </div>
  );
};

export default CategoryCard;
