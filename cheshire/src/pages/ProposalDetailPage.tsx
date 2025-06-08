import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { getProposalStatus } from "../utils/proposalUtils";
import SuggestionDisplay from "../components/suggestion/SuggestionDisplay";
import SuggestionForm from "../components/suggestion/SuggestionForm";
import type { Proposal } from "../utils/proposalUtils";

// Types for suggestions
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

// Loading component
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

// 404 Error component
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
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-w-md mx-auto">
      <p className="text-neutral-700 text-sm">
        <strong>Proposal ID:</strong>{" "}
        <span className="font-mono text-xs">{proposalId}</span>
      </p>
    </div>
  </div>
);

// Format time remaining
const getTimeRemaining = (voting_deadline: string) => {
  const now = new Date();
  const deadline = new Date(voting_deadline);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) return "Expired";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

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

        const response = await apiFetch(
          `http://localhost:8080/api/proposals/${id}`
        );

        if (response.status === 404) {
          setNotFound(true);
        } else if (response.ok) {
          const data = await response.json();
          setProposal(data.proposal);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load proposal");
        }
      } catch (err) {
        console.error("Error loading proposal:", err);
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id]);

  // Load suggestions when proposal is loaded
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!proposal) return;

      try {
        setSuggestionsLoading(true);
        const response = await apiFetch(
          `http://localhost:8080/api/proposals/${proposal.proposal_id}/suggestions`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } else {
          console.warn("Could not load suggestions");
          setSuggestions([]);
        }
      } catch (err) {
        console.warn("Error loading suggestions:", err);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadSuggestions();
  }, [proposal]);

  const handleGoBack = () => {
    navigate("/proposals");
  };

  const handleSuggestionCreated = () => {
    setShowSuggestionForm(false);
    // Reload suggestions
    if (proposal) {
      const loadSuggestions = async () => {
        try {
          const response = await apiFetch(
            `http://localhost:8080/api/proposals/${proposal.proposal_id}/suggestions`
          );
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.suggestions || []);
          }
        } catch (err) {
          console.warn("Error reloading suggestions:", err);
        }
      };
      loadSuggestions();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
        <div className="max-w-4xl mx-auto">
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
        <div className="max-w-4xl mx-auto">
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
  const canCreateNewSuggestions = canCreateSuggestions(
    proposal.voting_deadline
  );

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-4xl mx-auto">
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

        {/* Proposal Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 relative">
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
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              {proposal.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <span>👤</span>
                <span>{proposal.users.unique_id}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🏢</span>
                <span>{proposal.organizations.organization_name}</span>
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

          {/* Voting Info */}
          <div className="border-t border-neutral-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voting Status */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                  Voting Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span className="text-neutral-700">{timeRemaining}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span className="text-neutral-700">
                      Deadline: {formatDate(proposal.voting_deadline)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voting Options */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                  Voting Options ({proposal.options?.length || 0})
                </h3>
                <div className="space-y-2">
                  {proposal.options?.map((option) => (
                    <div
                      key={option.option_number}
                      className="flex items-center gap-2"
                    >
                      <span className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium text-neutral-600">
                        {option.option_number}
                      </span>
                      <span className="text-neutral-700">
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
            </div>
          </div>

          {/* PHASE C: Suggestions Section - Replaces "Voting Interface Coming Soon" */}
          <div className="border-t border-neutral-200 pt-6 mt-6">
            <SuggestionDisplay
              suggestions={suggestions}
              loading={suggestionsLoading}
              proposal={proposal}
              canCreateSuggestions={canCreateNewSuggestions}
              onCreateSuggestion={() => setShowSuggestionForm(true)}
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
