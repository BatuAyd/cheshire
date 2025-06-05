import React from "react";
import { useNavigate } from "react-router-dom";

// Types
interface ProposalOption {
  option_number: number;
  option_text: string;
}

interface Proposal {
  proposal_id: string;
  title: string;
  description: string;
  voting_deadline: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  organizations: {
    organization_name: string;
  };
  users: {
    unique_id: string;
    first_name: string;
    last_name: string;
  };
  options: ProposalOption[];
}

interface ProposalCardProps {
  proposal: Proposal;
}

// Status calculation logic
const getProposalStatus = (voting_deadline: string) => {
  const now = new Date();
  const deadline = new Date(voting_deadline);
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft < 0) return "EXPIRED";
  if (hoursLeft < 24) return "ENDING SOON";
  return "ACTIVE";
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

// Truncate description to first 60 words
const truncateDescription = (description: string, wordLimit: number = 60) => {
  const words = description.trim().split(/\s+/);
  if (words.length <= wordLimit) return description;
  return words.slice(0, wordLimit).join(" ") + "...";
};

// Format creation date
const formatCreatedDate = (created_at: string) => {
  return new Date(created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  const navigate = useNavigate();

  const status = getProposalStatus(proposal.voting_deadline);
  const timeRemaining = getTimeRemaining(proposal.voting_deadline);
  const truncatedDescription = truncateDescription(proposal.description);
  const createdDate = formatCreatedDate(proposal.created_at);

  const handleCardClick = () => {
    navigate(`/proposals/${proposal.proposal_id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-neutral-100"
    >
      {/* Status Badge - Absolute positioned top-right */}
      <div
        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
          status
        )}`}
      >
        {status}
      </div>

      {/* Title with icon */}
      <div className="flex items-start gap-2 mb-3 pr-20">
        {" "}
        {/* Right padding to avoid status badge */}
        <span className="text-neutral-600 mt-1 flex-shrink-0">📋</span>
        <h3 className="text-lg font-semibold text-neutral-800 leading-tight">
          {proposal.title}
        </h3>
      </div>

      {/* Description */}
      <p className="text-neutral-600 text-sm leading-relaxed mb-4">
        {truncatedDescription}
      </p>

      {/* Voting options count */}
      <div className="flex items-center gap-1 mb-2 text-sm text-neutral-600">
        <span>🗳️</span>
        <span>
          {proposal.options.length} voting option
          {proposal.options.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Time remaining and creator */}
      <div className="flex items-center gap-2 mb-2 text-sm text-neutral-600">
        <span>⏰</span>
        <span>{timeRemaining}</span>
        <span>•</span>
        <span>👤</span>
        <span>{proposal.users.unique_id}</span>
      </div>

      {/* Created date */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span>📅</span>
        <span>Created {createdDate}</span>
      </div>
    </div>
  );
};

export default ProposalCard;
