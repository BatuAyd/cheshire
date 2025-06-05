import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const ProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/proposals");
  };

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

        {/* Placeholder Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Proposal Detail Page
            </h1>
            <p className="text-neutral-600 mb-4">
              This is a placeholder for the individual proposal view.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-700 text-sm">
                <strong>Proposal ID:</strong> {id}
              </p>
              <p className="text-blue-600 text-xs mt-2">
                Full proposal details, voting options, and voting interface will
                be implemented in Phase D.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailPage;
