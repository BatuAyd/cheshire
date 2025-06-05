import React from "react";

interface EmptyStateProps {
  organizationName?: string;
  canCreateProposals?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  organizationName = "your organization",
  canCreateProposals = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Large icon */}
      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h3 className="text-xl font-semibold text-neutral-800 mb-2">
        No proposals yet
      </h3>

      {/* Description */}
      <p className="text-neutral-600 text-center max-w-md mb-6">
        There are no proposals in {organizationName} yet.
        {canCreateProposals
          ? " Use the Create New Proposal button above to start the conversation!"
          : " Proposals will appear here once they are created by members of your organization."}
      </p>

      {/* Help text for users who can't create */}
      {!canCreateProposals && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
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
                Need to create proposals?
              </h4>
              <p className="text-blue-700 text-sm">
                You must be part of an organization to create proposals.
                Complete your profile setup to get started.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
