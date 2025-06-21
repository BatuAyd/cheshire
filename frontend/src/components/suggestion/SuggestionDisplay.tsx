import React, { useState, useEffect, useMemo } from "react";
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

interface VotingStatus {
  has_voted: boolean;
  has_delegated: boolean;
  voted_option?: number;
  delegate_info?: {
    unique_id: string;
    name: string;
  };
  selected_option?: {
    option_number: number;
    option_text: string;
  };
  can_act: boolean;
  cooldown_active: boolean;
}

interface SuggestionDisplayProps {
  suggestions: Suggestion[];
  loading: boolean;
  proposal: Proposal;
  canCreateSuggestions: boolean;
  onCreateSuggestion: () => void;
  userVotingStatus?: VotingStatus | null; // Current user's voting status
}

const SuggestionDisplay: React.FC<SuggestionDisplayProps> = ({
  suggestions,
  loading,
  proposal,
  canCreateSuggestions,
  onCreateSuggestion,
  userVotingStatus,
}) => {
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [applyingStates, setApplyingStates] = useState<Record<string, boolean>>(
    {}
  );

  // Helper function to determine if a suggestion is applied based on current voting status
  const isSuggestionApplied = useMemo(() => {
    return (suggestion: Suggestion): boolean => {
      if (!userVotingStatus) return false;

      if (suggestion.suggestion_type === "vote_option") {
        // For vote suggestions: check if user voted for the suggested option
        return (
          userVotingStatus.has_voted &&
          userVotingStatus.voted_option === suggestion.target_option_number
        );
      } else if (suggestion.suggestion_type === "delegate") {
        // For delegate suggestions: check if user delegated to the suggested person
        return (
          userVotingStatus.has_delegated &&
          userVotingStatus.delegate_info?.unique_id === suggestion.target_user
        );
      }

      return false;
    };
  }, [userVotingStatus]);

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
      setApplyingStates((prev) => ({
        ...prev,
        [suggestion.suggestion_id]: false,
      }));
    }
  };

  // Check if user can create suggestions (must have created categories)
  const canUserCreateSuggestions = useMemo(() => {
    if (loadingCategories) return false;
    return userCategories.some((cat) => cat.created_by === proposal.created_by);
  }, [userCategories, loadingCategories, proposal.created_by]);

  // Check if voting is still active
  const isVotingActive = () => {
    const now = new Date();
    const deadline = new Date(proposal.voting_deadline);
    return now < deadline;
  };

  // Format suggestion creation time
  const formatSuggestionTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours === 1) {
      return "1 hour ago";
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">
            User Suggestions
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200 rounded-lg p-6 animate-pulse"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-4 bg-neutral-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-20"></div>
                </div>
                <div className="h-8 bg-neutral-200 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sort suggestions: vote suggestions first, then delegate suggestions
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    if (
      a.suggestion_type === "vote_option" &&
      b.suggestion_type === "delegate"
    ) {
      return -1;
    }
    if (
      a.suggestion_type === "delegate" &&
      b.suggestion_type === "vote_option"
    ) {
      return 1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-800">
          User Suggestions ({suggestions.length})
        </h3>

        {/* Create Suggestion Button */}
        {canCreateSuggestions && canUserCreateSuggestions && (
          <button
            onClick={onCreateSuggestion}
            className="px-4 py-2 bg-orange-400 text-white rounded-lg font-medium transition-all hover:bg-orange-500 hover:shadow-md active:scale-95 text-sm cursor-pointer"
          >
            Create Suggestion
          </button>
        )}
      </div>

      {/* Suggestions List or Empty State */}
      {sortedSuggestions.length === 0 ? (
        // Empty state
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-neutral-400"
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
          <h4 className="text-lg font-medium text-neutral-800 mb-2">
            No Suggestions Yet
          </h4>
          <p className="text-neutral-600 mb-6">
            {userCategories.length === 0
              ? "Follow some categories to see user suggestions here."
              : suggestions.length === 0
              ? "Categories you follow haven't made suggestions for this proposal yet."
              : "Be the first to create a suggestion for this proposal!"}
          </p>

          {/* Create suggestion CTA for eligible users */}
          {canCreateSuggestions && canUserCreateSuggestions && (
            <button
              onClick={onCreateSuggestion}
              className="px-6 py-3 bg-orange-400 text-white rounded-lg font-medium transition-all hover:bg-orange-500 hover:shadow-md active:scale-95 cursor-pointer"
            >
              Create First Suggestion
            </button>
          )}

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
          {sortedSuggestions.map((suggestion) => {
            const isApplying =
              applyingStates[suggestion.suggestion_id] || false;
            const isApplied = isSuggestionApplied(suggestion);
            const votingActive = isVotingActive();
            const cooldownActive = userVotingStatus?.cooldown_active || false;

            return (
              <div
                key={suggestion.suggestion_id}
                className={`bg-white border rounded-lg p-6 hover:shadow-md transition-all ${
                  isApplied
                    ? "border-green-200 bg-green-50/30"
                    : "border-neutral-200"
                }`}
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

                  {/* Apply Button with enhanced states */}
                  <button
                    onClick={() => handleApplySuggestion(suggestion)}
                    disabled={
                      isApplying ||
                      isApplied ||
                      !votingActive ||
                      (cooldownActive && !isApplied)
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      isApplied
                        ? "bg-green-100 text-green-700 cursor-not-allowed border border-green-200"
                        : !votingActive
                        ? "bg-neutral-100 text-neutral-500 cursor-not-allowed"
                        : cooldownActive && !isApplied
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
                    ) : cooldownActive && !isApplied ? (
                      "Apply"
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
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isApplied ? "bg-green-100" : "bg-purple-100"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            isApplied ? "text-green-600" : "text-purple-600"
                          }`}
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
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isApplied ? "bg-green-100" : "bg-green-100"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            isApplied ? "text-green-600" : "text-green-600"
                          }`}
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
                          {suggestion.users
                            ? `${suggestion.users.first_name} ${suggestion.users.last_name} (@${suggestion.target_user})`
                            : `@${suggestion.target_user}`}
                        </p>
                        <p className="text-neutral-600 text-sm">
                          Let this user vote on your behalf
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-neutral-800 mb-1">
                          <span className="font-medium">Vote for:</span> Option{" "}
                          {suggestion.target_option_number}
                        </p>
                        {suggestion.proposal_option && (
                          <p className="text-neutral-600 text-sm mb-2">
                            "{suggestion.proposal_option.option_text}"
                          </p>
                        )}
                        <p className="text-neutral-600 text-sm">
                          User recommends this choice
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

      {/* Info section */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-neutral-800 mb-2">
          About User Suggestions
        </h4>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Suggestions come from users in categories you follow. Click "Apply" to
          quickly vote or delegate based on user recommendations.
          {!isVotingActive() && " Voting has ended for this proposal."}
        </p>
      </div>
    </div>
  );
};

export default SuggestionDisplay;
