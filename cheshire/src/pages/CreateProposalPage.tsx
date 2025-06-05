import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProposalForm from "../components/proposal/ProposalForm";

const CreateProposalPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [formKey, setFormKey] = useState(0); // Key to force form reset

  const handleSuccess = (proposal: any) => {
    setSuccess(proposal);
    setError("");

    // Don't auto-clear success message - let user choose action
    // Removed the setTimeout auto-clear
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);

    // Auto-clear error after 8 seconds
    setTimeout(() => {
      setError("");
    }, 8000);
  };

  const handleCreateAnother = () => {
    setSuccess(null);
    setError("");
    setFormKey((prev) => prev + 1); // Force form to re-mount with fresh state
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-2">
                  ✅ Proposal Created Successfully!
                </h4>
                <div className="text-green-700 space-y-1">
                  <p>
                    <strong>Title:</strong> {success.title}
                  </p>
                  <p>
                    <strong>Voting Deadline:</strong>{" "}
                    {formatDate(success.voting_deadline)}
                  </p>
                  <p>
                    <strong>Options:</strong> {success.options?.length || 0}{" "}
                    voting options
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Proposal ID: {success.proposal_id}
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => navigate("/proposals")}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    View All Proposals
                  </button>
                  <button
                    onClick={handleCreateAnother}
                    className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Create Another Proposal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">
                  Error Creating Proposal
                </h4>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => setError("")}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form - Only show when no success message */}
        {!success && (
          <ProposalForm
            key={formKey} // Force re-mount when key changes
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}

        {/* Back Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-neutral-600 hover:text-orange-500 transition-colors flex items-center gap-2 mx-auto"
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
            Back to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProposalPage;
