import React, { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import type { Proposal } from "../../utils/proposalUtils";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Types
interface Suggestion {
  suggestion_id: string;
  suggestion_type: "delegate" | "vote_option";
  target_option_number?: number;
  target_user?: string;
  created_at: string;
  categories: {
    category_id: string;
    title: string;
  };
  users?: {
    unique_id: string;
    first_name: string;
    last_name: string;
  };
  proposal_option?: {
    option_number: number;
    option_text: string;
  };
}

interface Category {
  category_id: string;
  title: string;
  created_by: string;
}

interface SuggestionDisplayProps {
  suggestions: Suggestion[];
  loading: boolean;
  proposal: Proposal;
  canCreateSuggestions: boolean;
  onCreateSuggestion: () => void;
}

const SuggestionDisplay: React.FC<SuggestionDisplayProps> = ({
  suggestions,
  loading,
  proposal,
  canCreateSuggestions,
  onCreateSuggestion,
}) => {
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [applyingStates, setApplyingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [appliedStates, setAppliedStates] = useState<Record<string, boolean>>(
    {}
  );

  // Load user's categories to check if they can create suggestions
  useEffect(() => {
    const loadUserCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiFetch(
          `${API_BASE}/api/categories/organization?limit=200&offset=0`
        );

        if (response.ok) {
          const data = await response.json();
          setUserCategories(data.categories || []);
        }
      } catch (error) {
        console.warn("Could not load user categories:", error);
        setUserCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadUserCategories();
  }, []);

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    // Set loading state for this specific suggestion
    setApplyingStates((prev) => ({
      ...prev,
      [suggestion.suggestion_id]: true,
    }));

    try {
      if (suggestion.suggestion_type === "delegate") {
        // Handle delegation suggestion
        if (!suggestion.target_user) {
          throw new Error("No target user specified for delegation");
        }

        const response = await apiFetch(
          `${API_BASE}/api/proposals/${proposal.proposal_id}/delegate`,
          {
            method: "POST",
            body: JSON.stringify({
              target_user: suggestion.target_user,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Success notification
          const targetName = suggestion.users
            ? `${suggestion.users.first_name} ${suggestion.users.last_name}`
            : suggestion.target_user;

          alert(
            `✅ Successfully delegated your vote to ${targetName} (@${suggestion.target_user})`
          );

          // Mark as applied
          setAppliedStates((prev) => ({
            ...prev,
            [suggestion.suggestion_id]: true,
          }));
        } else {
          // Handle specific errors
          if (response.status === 429) {
            alert(
              `⏳ Rate limit: ${data.error}\nPlease wait ${
                data.cooldown_seconds || 60
              } seconds before trying again.`
            );
          } else if (
            response.status === 400 &&
            data.error?.includes("Delegation not allowed")
          ) {
            alert(`🚫 ${data.error}`);
          } else if (response.status === 410) {
            alert("⏰ Voting period has ended for this proposal.");
          } else {
            alert(`❌ Failed to delegate: ${data.error || "Unknown error"}`);
          }
        }
      } else if (suggestion.suggestion_type === "vote_option") {
        // Handle voting suggestion
        if (!suggestion.target_option_number) {
          throw new Error("No target option specified for voting");
        }

        const response = await apiFetch(
          `${API_BASE}/api/proposals/${proposal.proposal_id}/vote`,
          {
            method: "POST",
            body: JSON.stringify({
              option_number: suggestion.target_option_number,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Success notification
          const optionText =
            suggestion.proposal_option?.option_text ||
            `Option ${suggestion.target_option_number}`;

          alert(`✅ Successfully voted for: "${optionText}"`);

          // Mark as applied
          setAppliedStates((prev) => ({
            ...prev,
            [suggestion.suggestion_id]: true,
          }));
        } else {
          // Handle specific errors
          if (response.status === 429) {
            alert(
              `⏳ Rate limit: ${data.error}\nPlease wait ${
                data.cooldown_seconds || 60
              } seconds before trying again.`
            );
          } else if (response.status === 410) {
            alert("⏰ Voting period has ended for this proposal.");
          } else if (
            response.status === 400 &&
            data.error?.includes("Option")
          ) {
            alert(`🚫 ${data.error}`);
          } else {
            alert(`❌ Failed to vote: ${data.error || "Unknown error"}`);
          }
        }
      }
    } catch (error) {
      console.error("Error applying suggestion:", error);
      alert(
        `❌ Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Clear loading state
      setApplyingStates((prev) => ({
        ...prev,
        [suggestion.suggestion_id]: false,
      }));
    }
  };

  const formatSuggestionTime = (created_at: string) => {
    return new Date(created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if voting is still active
  const isVotingActive = () => {
    const now = new Date();
    const deadline = new Date(proposal.voting_deadline);
    return now < deadline;
  };

  // Check if user owns any categories (can create suggestions)
  const userOwnsCategories = userCategories.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-800">
          Category Suggestions
        </h3>

        {/* Create Suggestion Button - Only show if user owns categories and can create suggestions */}
        {userOwnsCategories && canCreateSuggestions && (
          <button
            onClick={onCreateSuggestion}
            disabled={loadingCategories}
            className="px-4 py-2 bg-orange-400 text-white rounded-lg font-medium transition-all hover:bg-orange-500 hover:shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Suggestion
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        // Loading state
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-6 bg-neutral-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        // Empty state
        <div className="bg-neutral-50 rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-neutral-700 mb-2">
            No suggestions yet
          </h4>
          <p className="text-neutral-600 text-sm">
            {userOwnsCategories && canCreateSuggestions
              ? "Be the first to create a suggestion for this proposal!"
              : "Categories you follow haven't made suggestions for this proposal yet."}
          </p>

          {/* Info about suggestions deadline */}
          {!canCreateSuggestions && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-700 text-sm">
                ⏰ Suggestion creation period has ended (within 1 hour of voting
                deadline)
              </p>
            </div>
          )}
        </div>
      ) : (
        // Suggestions list
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const isApplying =
              applyingStates[suggestion.suggestion_id] || false;
            const isApplied = appliedStates[suggestion.suggestion_id] || false;
            const votingActive = isVotingActive();

            return (
              <div
                key={suggestion.suggestion_id}
                className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Header with category and apply button */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-1">
                      {suggestion.categories.title}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {formatSuggestionTime(suggestion.created_at)}
                    </p>
                  </div>

                  {/* Apply Button with different states */}
                  <button
                    onClick={() => handleApplySuggestion(suggestion)}
                    disabled={isApplying || isApplied || !votingActive}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      isApplied
                        ? "bg-green-100 text-green-700 cursor-not-allowed"
                        : !votingActive
                        ? "bg-neutral-100 text-neutral-500 cursor-not-allowed"
                        : isApplying
                        ? "bg-blue-300 text-white cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95 cursor-pointer"
                    }`}
                  >
                    {isApplying ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Applying...
                      </div>
                    ) : isApplied ? (
                      <div className="flex items-center gap-1">
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
                        Applied
                      </div>
                    ) : !votingActive ? (
                      "Voting Ended"
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>

                {/* Suggestion content */}
                <div className="flex items-start gap-3">
                  {/* Icon based on suggestion type */}
                  <div className="flex-shrink-0 mt-1">
                    {suggestion.suggestion_type === "delegate" ? (
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Suggestion text */}
                  <div className="flex-1">
                    {suggestion.suggestion_type === "delegate" ? (
                      <div>
                        <p className="text-neutral-800 mb-1">
                          <span className="font-medium">Delegate to:</span>{" "}
                          {suggestion.users ? (
                            <>
                              {suggestion.users.first_name}{" "}
                              {suggestion.users.last_name}{" "}
                              <span className="text-neutral-500">
                                (@{suggestion.target_user})
                              </span>
                            </>
                          ) : (
                            <span className="text-neutral-500">
                              @{suggestion.target_user}
                            </span>
                          )}
                        </p>
                        <p className="text-neutral-600 text-sm">
                          Let this expert vote on your behalf for this proposal.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-neutral-800 mb-1">
                          <span className="font-medium">Vote for:</span>{" "}
                          {suggestion.proposal_option ? (
                            <span className="font-medium text-blue-600">
                              {suggestion.proposal_option.option_text}
                            </span>
                          ) : (
                            <span className="font-medium text-blue-600">
                              Option {suggestion.target_option_number}
                            </span>
                          )}
                        </p>
                        <p className="text-neutral-600 text-sm">
                          This category recommends choosing this option.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box about suggestions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">
              About Category Suggestions
            </h4>
            <p className="text-blue-700 text-sm">
              These suggestions come from categories you follow. Click "Apply"
              to quickly vote or delegate based on expert recommendations.
              {!isVotingActive() && " Voting has ended for this proposal."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionDisplay;
