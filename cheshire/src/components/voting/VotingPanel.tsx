import React, { useState, useEffect } from "react";
import VotingStatus from "./VotingStatus";
import VoteModal from "./VoteModal";
import DelegateModal from "./DelegateModal";
import ResultsVisualization from "./ResultsVisualization";
import { apiFetch } from "../../utils/api";
import type { Proposal } from "../../utils/proposalUtils";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

interface VotingPanelProps {
  proposal: Proposal & {
    vote_results?: {
      optionResults: Record<string, number>;
      metadata: {
        totalVotingPower: number;
        totalVotesCast: number;
        winningOption: number | null;
      };
      computedAt: string;
    };
  };
  isExpired: boolean;
  onVotingStatusChange?: () => void; // Callback for when voting status changes
}

interface VotingStatusData {
  proposal_id: string;
  proposal_title: string;
  voting_deadline: string;
  time_remaining_seconds: number;
  is_active: boolean;
  user_status: {
    has_voted: boolean;
    voted_option?: number;
    selected_option?: {
      option_number: number;
      option_text: string;
    };
    has_delegated: boolean;
    delegate_info?: {
      unique_id: string;
      name: string;
    };
    can_act: boolean;
    cooldown_active: boolean;
  };
  options: Array<{
    option_number: number;
    option_text: string;
  }>;
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  proposal,
  isExpired,
  onVotingStatusChange,
}) => {
  const [votingStatus, setVotingStatus] = useState<VotingStatusData | null>(
    null
  );
  const [statusLoading, setStatusLoading] = useState(true);
  const [deadlinePassed, setDeadlinePassed] = useState(isExpired);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);

  // Load voting status
  const loadVotingStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await apiFetch(
        `${API_BASE}/api/proposals/${proposal.proposal_id}/voting-status`
      );

      if (response.ok) {
        const data = await response.json();
        setVotingStatus(data);
      } else {
        console.error("Failed to load voting status");
        setVotingStatus(null);
      }
    } catch (error) {
      console.error("Error loading voting status:", error);
      setVotingStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  // Set up deadline awareness using API response
  useEffect(() => {
    if (votingStatus) {
      // Use the is_active flag from API instead of client-side calculation
      setDeadlinePassed(!votingStatus.is_active);
    } else if (isExpired) {
      setDeadlinePassed(true);
    }
  }, [votingStatus, isExpired]);

  // Set up cooldown refresh timer
  useEffect(() => {
    if (votingStatus?.user_status?.cooldown_active && !deadlinePassed) {
      // Set a timer to refresh voting status after 60 seconds
      const cooldownTimer = setTimeout(() => {
        console.log("Cooldown expired, refreshing voting status...");
        loadVotingStatus();
      }, 61000); // 61 seconds to ensure cooldown has definitely expired

      return () => clearTimeout(cooldownTimer);
    }
  }, [votingStatus?.user_status?.cooldown_active, deadlinePassed]);

  // Load status on mount
  useEffect(() => {
    loadVotingStatus();
  }, [proposal.proposal_id]);

  const handleVoteClick = () => {
    setShowVoteModal(true);
  };

  const handleDelegateClick = () => {
    setShowDelegateModal(true);
  };

  const handleModalSuccess = () => {
    // Refresh voting status when vote or delegation is successful
    loadVotingStatus();
    // Also notify parent component to refresh suggestion status
    if (onVotingStatusChange) {
      onVotingStatusChange();
    }
  };

  const isButtonDisabled =
    deadlinePassed ||
    (votingStatus?.user_status?.cooldown_active && !deadlinePassed);

  // For expired proposals, show results
  if (isExpired) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200">
        {/* Results Visualization or User Status */}
        {proposal.vote_results ? (
          <ResultsVisualization
            results={proposal.vote_results}
            options={proposal.options || []}
          />
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              Final Results
            </h3>
            <div className="text-center text-neutral-500 py-8">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-neutral-600 mb-2">
                Results are being calculated
              </p>
              <p className="text-sm text-neutral-500">
                Please check back later
              </p>
            </div>
          </div>
        )}

        {/* User's participation status */}
        <div className="border-t border-neutral-200 pt-6 mt-6">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">
            Your Participation
          </h4>
          <VotingStatus
            status={votingStatus?.user_status || null}
            loading={statusLoading}
          />
        </div>
      </div>
    );
  }

  // For active proposals, show voting interface
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Your Vote</h3>

      {/* Current voting status */}
      <VotingStatus
        status={votingStatus?.user_status || null}
        loading={statusLoading}
      />

      {/* Voting deadline warning */}
      {deadlinePassed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 text-sm font-medium">
              Voting has ended
            </span>
          </div>
        </div>
      )}

      {/* Rate limit warning */}
      {votingStatus?.user_status?.cooldown_active && !deadlinePassed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-700 text-sm">
              Please wait 60 seconds before your next action
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={handleVoteClick}
          disabled={isButtonDisabled}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            isButtonDisabled
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md active:scale-95 cursor-pointer"
          }`}
        >
          Vote Directly
        </button>

        <button
          onClick={handleDelegateClick}
          disabled={isButtonDisabled}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all border ${
            isButtonDisabled
              ? "bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed"
              : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:shadow-sm active:scale-95 cursor-pointer"
          }`}
        >
          Delegate Vote
        </button>
      </div>

      {/* Help text */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500 leading-relaxed">
          Vote directly on proposals you understand, or delegate to users in
          relevant areas.
        </p>
      </div>

      {/* Voting Modals */}
      {showVoteModal && (
        <VoteModal
          proposal={proposal}
          currentVote={votingStatus?.user_status?.selected_option || null}
          onClose={() => setShowVoteModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showDelegateModal && (
        <DelegateModal
          proposal={proposal}
          currentDelegate={votingStatus?.user_status?.delegate_info || null}
          onClose={() => setShowDelegateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default VotingPanel;
