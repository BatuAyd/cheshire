import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { SuggestionDisplay, SuggestionForm } from "../components/suggestion";
import { VotingPanel } from "../components/voting";
import type { Proposal } from "../utils/proposalUtils";

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

// Local components for loading and error states
const ProposalDetailSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
    <div className="h-8 bg-neutral-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-neutral-200 rounded w-1/4 mb-6"></div>
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-neutral-200 rounded w-full"></div>
      <div className="h-4 bg-neutral-200 rounded w-full"></div>
      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
    </div>
    <div className="border-t pt-6">
      <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const ProposalNotFound = ({ proposalId }: { proposalId: string }) => (
  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-8 h-8 text-red-500"
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
    <h1 className="text-2xl font-bold text-neutral-800 mb-2">
      Proposal Not Found
    </h1>
    <p className="text-neutral-600 mb-4">
      The proposal you're looking for doesn't exist or you don't have access to
      it.
    </p>
    <p className="text-sm text-neutral-500">Proposal ID: {proposalId}</p>
  </div>
);

// Utility functions
const getProposalStatus = (voting_deadline: string) => {
  const now = new Date();
  const deadline = new Date(voting_deadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) return "EXPIRED";
  if (diffHours <= 24) return "ENDING SOON";
  return "ACTIVE";
};

const getTimeRemaining = (voting_deadline: string) => {
  const now = new Date();
  const deadline = new Date(voting_deadline);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Voting has ended";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} left`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} left`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${Math.max(1, diffMinutes)} minute${
      diffMinutes === 1 ? "" : "s"
    } left`;
  }
};

// Check if suggestions can still be created (1 hour before deadline)
const canCreateSuggestions = (voting_deadline: string) => {
  const now = new Date();
  const deadline = new Date(voting_deadline);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return deadline > oneHourFromNow;
};

// Format creation date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get status badge styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/20 text-green-700 backdrop-blur-sm";
    case "ENDING SOON":
      return "bg-orange-500/20 text-orange-700 backdrop-blur-sm";
    case "EXPIRED":
      return "bg-red-500/20 text-red-700 backdrop-blur-sm";
    default:
      return "bg-gray-500/20 text-gray-700 backdrop-blur-sm";
  }
};

const ProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(`${API_BASE}/api/proposals/${id}`);

        if (response.status === 404) {
          setNotFound(true);
        } else if (response.ok) {
          const data = await response.json();
          // Merge vote_results into proposal object for easier access
          const proposalWithResults = {
            ...data.proposal,
            ...(data.vote_results && { vote_results: data.vote_results }),
          };
          setProposal(proposalWithResults);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load proposal");
        }
      } catch (err) {
        console.error("Error loading proposal:", err);
        setError("Network error - please try again");
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id]);

  // Load voting status
  const loadVotingStatus = async (proposalId: string) => {
    try {
      const response = await apiFetch(
        `${API_BASE}/api/proposals/${proposalId}/voting-status`
      );

      if (response.ok) {
        const data = await response.json();
        setVotingStatus(data.user_status);
      } else {
        console.warn("Failed to load voting status for suggestions");
        setVotingStatus(null);
      }
    } catch (error) {
      console.warn("Error loading voting status for suggestions:", error);
      setVotingStatus(null);
    }
  };

  // Set up cooldown refresh timer for suggestions
  useEffect(() => {
    if (votingStatus?.cooldown_active && proposal) {
      // Check if proposal is expired locally
      const now = new Date();
      const deadline = new Date(proposal.voting_deadline);
      const proposalExpired = deadline <= now;

      // Only set timer for active proposals
      if (!proposalExpired) {
        // Set a timer to refresh voting status after 61 seconds
        const cooldownTimer = setTimeout(() => {
          console.log(
            "Suggestion cooldown expired, refreshing voting status..."
          );
          loadVotingStatus(proposal.proposal_id);
        }, 61000); // 61 seconds to ensure cooldown has definitely expired

        return () => clearTimeout(cooldownTimer);
      }
    }
  }, [votingStatus?.cooldown_active, proposal]);

  // Load suggestions and voting status
  useEffect(() => {
    const loadSuggestionsAndStatus = async () => {
      if (!proposal) return;

      // Load suggestions
      try {
        setSuggestionsLoading(true);
        const response = await apiFetch(
          `${API_BASE}/api/proposals/${proposal.proposal_id}/suggestions`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } else {
          console.warn("Failed to load suggestions");
          setSuggestions([]);
        }
      } catch (error) {
        console.warn("Error loading suggestions:", error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }

      // Load voting status for suggestion applied detection
      await loadVotingStatus(proposal.proposal_id);
    };

    loadSuggestionsAndStatus();
  }, [proposal]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSuggestionCreated = () => {
    // Reload suggestions and voting status after creation
    setSuggestions((prev) => prev); // Trigger useEffect to reload
    setShowSuggestionForm(false);

    // Reload suggestions and voting status from API
    const loadSuggestionsAndStatus = async () => {
      if (!proposal) return;

      try {
        setSuggestionsLoading(true);
        const response = await apiFetch(
          `${API_BASE}/api/proposals/${proposal.proposal_id}/suggestions`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.warn("Error reloading suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }

      // Also reload voting status to update applied detection
      await loadVotingStatus(proposal.proposal_id);
    };

    if (proposal) {
      loadSuggestionsAndStatus();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-neutral-600 hover:text-orange-500 transition-colors mb-6"
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
            Back to Proposals
          </button>

          {/* Loading Skeleton */}
          <ProposalDetailSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !notFound) {
    return (
      <div className="min-h-[80vh] px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-neutral-600 hover:text-orange-500 transition-colors mb-6"
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
            Back to Proposals
          </button>

          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
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
              Error Loading Proposal
            </h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 404 state
  if (notFound) {
    return (
      <div className="min-h-[80vh] px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-neutral-600 hover:text-orange-500 transition-colors mb-6"
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
            Back to Proposals
          </button>

          <ProposalNotFound proposalId={id || "unknown"} />
        </div>
      </div>
    );
  }

  // Proposal loaded successfully
  if (!proposal) return null;

  const status = getProposalStatus(proposal.voting_deadline);
  const timeRemaining = getTimeRemaining(proposal.voting_deadline);
  const isExpired = status === "EXPIRED";
  const canCreateNewSuggestions = canCreateSuggestions(
    proposal.voting_deadline
  );

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-orange-500 transition-colors mb-6"
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
          Back to Proposals
        </button>

        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[65fr_35fr] gap-8">
          {/* Left Panel - Proposal Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-neutral-200 relative">
            {/* Status Badge */}
            <div
              className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                status
              )}`}
            >
              {status}
            </div>

            {/* Header */}
            <div className="pr-24 mb-6">
              <h1 className="text-3xl font-bold text-neutral-800 mb-3">
                {proposal.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span>{proposal.users.unique_id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Created {formatDate(proposal.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-800 mb-3">
                Description
              </h2>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {proposal.description}
              </p>
            </div>

            {/* Voting Options */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Voting Options ({proposal.options?.length || 0})
              </h3>
              <div className="space-y-3">
                {proposal.options?.map((option) => (
                  <div
                    key={option.option_number}
                    className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <span className="w-7 h-7 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-sm font-medium text-neutral-700 flex-shrink-0 mt-0.5">
                      {option.option_number}
                    </span>
                    <span className="text-neutral-700 leading-relaxed">
                      {option.option_text}
                    </span>
                  </div>
                )) || (
                  <p className="text-neutral-500 italic">
                    No voting options available
                  </p>
                )}
              </div>
            </div>

            {/* Voting Deadline Info */}
            <div className="border-t border-neutral-200 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <span className="text-neutral-700 font-medium">
                    {timeRemaining}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span className="text-neutral-700">
                    Deadline: {formatDate(proposal.voting_deadline)}
                  </span>
                </div>
              </div>
            </div>

            {/* User Suggestions Section */}
            {!isExpired && (
              <div className="border-t border-neutral-200 pt-6 mt-6">
                <SuggestionDisplay
                  suggestions={suggestions}
                  loading={suggestionsLoading}
                  proposal={proposal}
                  canCreateSuggestions={canCreateNewSuggestions}
                  onCreateSuggestion={() => setShowSuggestionForm(true)}
                  userVotingStatus={votingStatus}
                />
              </div>
            )}
          </div>

          {/* Right Panel - Voting Interface */}
          <div className="h-fit">
            <VotingPanel
              proposal={proposal}
              isExpired={isExpired}
              onVotingStatusChange={() => {
                // Refresh voting status when user votes/delegates
                if (proposal) {
                  loadVotingStatus(proposal.proposal_id);
                }
              }}
            />
          </div>
        </div>

        {/* Suggestion Creation Form Modal */}
        {showSuggestionForm && (
          <SuggestionForm
            proposal={proposal}
            onClose={() => setShowSuggestionForm(false)}
            onSuccess={handleSuggestionCreated}
          />
        )}
      </div>
    </div>
  );
};

export default ProposalDetailPage;
