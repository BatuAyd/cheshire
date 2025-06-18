import React from "react";

interface VotingStatusProps {
  status: {
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
  } | null;
  loading: boolean;
}

const VotingStatus: React.FC<VotingStatusProps> = ({ status, loading }) => {
  if (loading) {
    return (
      <div className="bg-neutral-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-neutral-200 rounded-full animate-pulse"></div>
          <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-neutral-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-neutral-300 rounded-full flex items-center justify-center">
            <span className="text-neutral-500 text-xs">?</span>
          </div>
          <span className="text-neutral-600">Unable to load voting status</span>
        </div>
      </div>
    );
  }

  // User has voted
  if (status.has_voted && status.selected_option) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div className="text-green-800 font-medium">
              You voted for Option {status.selected_option.option_number}
            </div>
            <div className="text-green-700 text-sm mt-1">
              "{status.selected_option.option_text}"
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has delegated
  if (status.has_delegated && status.delegate_info) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
          <div>
            <div className="text-blue-800 font-medium">
              You delegated to @{status.delegate_info.unique_id}
            </div>
            <div className="text-blue-700 text-sm mt-1">
              {status.delegate_info.name}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User hasn't participated yet
  return (
    <div className="bg-neutral-50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
        </div>
        <span className="text-neutral-600">You haven't participated yet</span>
      </div>
    </div>
  );
};

export default VotingStatus;
