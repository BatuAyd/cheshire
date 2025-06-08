import React, { useEffect, useState } from "react";

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

interface CategoryModalProps {
  category: Category;
  onClose: () => void;
  onFollowToggle: (categoryId: string, isFollowing: boolean) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  onClose,
  onFollowToggle,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Format creation date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show modal with animation
  useEffect(() => {
    setIsVisible(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Handle follow toggle
  const handleFollowClick = async () => {
    setIsFollowLoading(true);
    try {
      await onFollowToggle(category.category_id, category.is_following);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-neutral-500"
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

        {/* Modal Content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              {/* Left side - Title and Creator Info */}
              <div className="flex-1 pr-8">
                <h2 className="text-3xl font-bold text-neutral-900 mb-3 leading-tight">
                  {category.title}
                </h2>
                <div className="flex items-center gap-6 text-neutral-600 mb-2">
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {category.users.first_name} {category.users.last_name} (@
                    {category.users.unique_id})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    {category.follower_count} follower
                    {category.follower_count === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Info with Icon */}
                <div className="relative inline-flex items-center gap-2">
                  <span className="text-sm text-neutral-500">
                    Follow to get voting suggestions
                  </span>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowInfo(true)}
                      onMouseLeave={() => setShowInfo(false)}
                      className="p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                      aria-label="More info"
                    >
                      <svg
                        className="w-4 h-4 text-neutral-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Info Tooltip */}
                    {showInfo && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-neutral-800 text-white text-sm rounded-lg p-3 shadow-lg z-20">
                        <p>
                          You'll see voting suggestions from{" "}
                          <strong>{category.users.first_name}</strong> on
                          proposal pages when you follow this category.
                        </p>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-neutral-800 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Follow Button under where close button is */}
              <div className="flex flex-col items-end gap-2 pt-12">
                <button
                  onClick={handleFollowClick}
                  disabled={isFollowLoading}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                    category.is_following
                      ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300"
                      : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md"
                  } ${
                    isFollowLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "active:scale-95"
                  }`}
                >
                  {isFollowLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                      {category.is_following
                        ? "Unfollowing..."
                        : "Following..."}
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      {category.is_following ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Following
                        </>
                      ) : (
                        "Follow"
                      )}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              About this category
            </h3>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {category.description}
            </p>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Created {formatDate(category.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
