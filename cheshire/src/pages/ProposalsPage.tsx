import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProposalCard from "../components/proposal/ProposalCard";
import LoadingSkeleton from "../components/proposal/LoadingSkeleton";
import EmptyState from "../components/proposal/EmptyState";

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

interface ProposalsResponse {
  proposals: Proposal[];
  organization_id: string;
  limit: number;
  offset: number;
  count: number;
}

interface CanCreateResponse {
  can_create: boolean;
  organization_id: string | null;
  organization_name: string | null;
}

const ProposalsPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [organizationInfo, setOrganizationInfo] =
    useState<CanCreateResponse | null>(null);

  // Load organization info and proposals
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Load organization info and permissions in parallel
        const [proposalsResponse, canCreateResponse] = await Promise.all([
          fetch(
            "http://localhost:8080/api/proposals/organization?limit=18&offset=0",
            {
              credentials: "include",
            }
          ),
          fetch("http://localhost:8080/api/proposals/can-create", {
            credentials: "include",
          }),
        ]);

        // Handle proposals response
        if (proposalsResponse.ok) {
          const proposalsData: ProposalsResponse =
            await proposalsResponse.json();
          setProposals(proposalsData.proposals || []);
        } else {
          const proposalsError = await proposalsResponse.json();
          throw new Error(proposalsError.error || "Failed to load proposals");
        }

        // Handle can-create response
        if (canCreateResponse.ok) {
          const canCreateData: CanCreateResponse =
            await canCreateResponse.json();
          setOrganizationInfo(canCreateData);
        } else {
          // Don't throw error for can-create failure, just log it
          console.warn("Failed to load organization info");
        }
      } catch (err) {
        console.error("Error loading proposals:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load proposals"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateProposal = () => {
    navigate("/create-proposal");
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
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
            Error Loading Proposals
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              Proposals
            </h1>
            <p className="text-neutral-600">
              {organizationInfo?.organization_name
                ? `Active and past proposals for ${organizationInfo.organization_name}`
                : "Active and past proposals for your organization"}
            </p>
          </div>

          {/* Create Proposal Button */}
          {organizationInfo?.can_create && (
            <button
              onClick={handleCreateProposal}
              className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-orange-400 text-white rounded-lg font-medium transition-all hover:bg-orange-500 hover:shadow-md active:scale-95 gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Proposal
            </button>
          )}
        </div>

        {/* Main Content */}
        {loading ? (
          // Loading State - 18 skeleton cards
          <LoadingSkeleton />
        ) : proposals.length === 0 ? (
          // Empty State
          <EmptyState
            organizationName={organizationInfo?.organization_name || undefined}
            canCreateProposals={organizationInfo?.can_create || false}
          />
        ) : (
          // Proposals Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.proposal_id} proposal={proposal} />
            ))}
          </div>
        )}

        {/* Future: Pagination will go here in later phases */}
        {!loading && proposals.length > 0 && (
          <div className="mt-12 text-center text-neutral-500">
            <p>
              Showing {proposals.length} proposal
              {proposals.length === 1 ? "" : "s"}
            </p>
            <p className="text-sm mt-1">Pagination placeholder</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsPage;
