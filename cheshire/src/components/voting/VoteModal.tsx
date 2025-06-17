import React, { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import type { Proposal } from "../../utils/proposalUtils";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

interface VoteModalProps {
  proposal: Proposal;
  currentVote?: {
    option_number: number;
    option_text: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VoteModal: React.FC<VoteModalProps> = ({
  proposal,
  currentVote,
  onClose,
  onSuccess,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number>(
    currentVote?.option_number || 1
  );
  const [submitting, setSubmitting] = useState(false);

  // Show modal with animation
  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption || submitting) return;

    try {
      setSubmitting(true);

      const response = await apiFetch(
        `${API_BASE}/api/proposals/${proposal.proposal_id}/vote`,
        {
          method: "POST",
          body: JSON.stringify({
            option_number: selectedOption,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const selectedOptionText = proposal.options?.find(
          (opt) => opt.option_number === selectedOption
        )?.option_text;

        // Show success message
        console.log(
          `✅ Vote cast for Option ${selectedOption}: ${selectedOptionText}`
        );

        onSuccess(); // Refresh voting status
        handleClose();
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
        } else if (response.status === 400 && data.error?.includes("Option")) {
          alert(`🚫 ${data.error}`);
        } else {
          alert(`❌ Failed to vote: ${data.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      alert(
        `❌ Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOptionData = proposal.options?.find(
    (opt) => opt.option_number === selectedOption
  );

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
        className={`relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={submitting}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10 disabled:opacity-50"
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
          <div className="mb-6 pr-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Cast Your Vote
            </h2>
            <p className="text-neutral-600">
              Select your preferred option for "{proposal.title}"
            </p>
            {currentVote && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <span className="font-medium">Current vote:</span> Option{" "}
                  {currentVote.option_number} - {currentVote.option_text}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Voting Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-4">
                Choose your option:
              </label>
              <div className="space-y-3">
                {proposal.options?.map((option) => (
                  <label
                    key={option.option_number}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOption === option.option_number
                        ? "border-orange-300 bg-orange-50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="voting_option"
                      value={option.option_number}
                      checked={selectedOption === option.option_number}
                      onChange={(e) =>
                        setSelectedOption(parseInt(e.target.value))
                      }
                      disabled={submitting}
                      className="mt-1 text-orange-400 focus:ring-orange-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium text-neutral-600">
                          {option.option_number}
                        </span>
                        <span className="font-medium text-neutral-800">
                          Option {option.option_number}
                        </span>
                      </div>
                      <p className="text-neutral-700 leading-relaxed">
                        {option.option_text}
                      </p>
                    </div>
                  </label>
                )) || (
                  <p className="text-neutral-500 italic">
                    No voting options available
                  </p>
                )}
              </div>
            </div>

            {/* Selected option preview */}
            {selectedOptionData && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-green-800 font-medium mb-1">
                  You're voting for:
                </h4>
                <p className="text-green-700 text-sm">
                  Option {selectedOptionData.option_number}:{" "}
                  {selectedOptionData.option_text}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 py-3 px-4 border border-neutral-300 text-neutral-700 rounded-lg font-medium transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedOption}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  submitting || !selectedOption
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md active:scale-95 cursor-pointer"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Casting Vote...
                  </span>
                ) : currentVote ? (
                  "Update Vote"
                ) : (
                  "Cast Vote"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
