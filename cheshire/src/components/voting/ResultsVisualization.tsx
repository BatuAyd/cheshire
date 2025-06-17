import React from "react";

interface VoteResults {
  optionResults: Record<string, number>; // { "1": 25.5, "2": 18.0, "3": 12.5 }
  metadata: {
    totalVotingPower: number; // Total participants (delegators + direct voters)
    totalVotesCast: number; // Direct voters only
    winningOption: number | null;
  };
}

interface ProposalOption {
  option_number: number;
  option_text: string;
}

interface ResultsVisualizationProps {
  results: VoteResults;
  options: ProposalOption[];
}

const ResultsVisualization: React.FC<ResultsVisualizationProps> = ({
  results,
  options,
}) => {
  if (!results || !options || options.length === 0) {
    return (
      <div className="text-center text-neutral-500 italic py-8">
        No results available
      </div>
    );
  }

  const { optionResults, metadata } = results;
  const totalVotes = metadata.totalVotingPower;

  // Sort options by vote count (highest first)
  const sortedOptions = options
    .map((option) => ({
      ...option,
      votes: optionResults[option.option_number.toString()] || 0,
      percentage:
        totalVotes > 0
          ? ((optionResults[option.option_number.toString()] || 0) /
              totalVotes) *
            100
          : 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const winningOption = metadata.winningOption;
  const hasVotes = totalVotes > 0;

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
          Final Results
        </h3>
        {!hasVotes ? (
          <p className="text-neutral-600 text-sm">No votes were cast</p>
        ) : winningOption ? (
          <p className="text-neutral-600 text-sm">
            Winner: Option {winningOption}
          </p>
        ) : (
          <p className="text-neutral-600 text-sm">Result: Tie</p>
        )}
      </div>

      {/* Option Results */}
      <div className="space-y-4">
        {sortedOptions.map((option, index) => {
          const isWinner = option.option_number === winningOption && hasVotes;
          const isTie = !winningOption && option.votes > 0 && hasVotes;

          return (
            <div key={option.option_number} className="space-y-2">
              {/* Option Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      isWinner
                        ? "bg-green-500 text-white"
                        : isTie
                        ? "bg-orange-400 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {option.option_number}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isWinner ? "text-green-800" : "text-neutral-700"
                    }`}
                  >
                    Option {option.option_number}
                    {isWinner && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Winner
                      </span>
                    )}
                    {isTie && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        Tied
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className={`font-medium ${
                      isWinner ? "text-green-800" : "text-neutral-800"
                    }`}
                  >
                    {option.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-neutral-600">
                    {option.votes} vote{option.votes === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              {/* Option Text */}
              <p className="text-neutral-700 text-sm leading-relaxed pl-9">
                {option.option_text}
              </p>

              {/* Progress Bar */}
              <div className="pl-9">
                <div className="w-full bg-neutral-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ease-out ${
                      isWinner
                        ? "bg-green-500"
                        : isTie
                        ? "bg-orange-400"
                        : index === 0 && hasVotes // Leading option if no clear winner
                        ? "bg-blue-400"
                        : "bg-neutral-400"
                    }`}
                    style={{
                      width: `${Math.max(
                        option.percentage,
                        option.votes > 0 ? 3 : 0
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="border-t border-neutral-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-800">
              {metadata.totalVotingPower}
            </div>
            <div className="text-neutral-600">Total Participants</div>
            <div className="text-xs text-neutral-500 mt-1">
              Including delegators
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-800">
              {metadata.totalVotesCast}
            </div>
            <div className="text-neutral-600">Direct Voters</div>
            <div className="text-xs text-neutral-500 mt-1">
              Excluding delegators
            </div>
          </div>
        </div>
      </div>

      {/* Participation Note */}
      {hasVotes && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <p className="text-xs text-neutral-600 text-center">
            {metadata.totalVotesCast === metadata.totalVotingPower
              ? "All participants voted directly"
              : `${
                  metadata.totalVotingPower - metadata.totalVotesCast
                } participant${
                  metadata.totalVotingPower - metadata.totalVotesCast === 1
                    ? ""
                    : "s"
                } delegated their vote${
                  metadata.totalVotingPower - metadata.totalVotesCast === 1
                    ? ""
                    : "s"
                }`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsVisualization;
