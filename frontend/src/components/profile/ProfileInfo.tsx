interface ProfileInfoProps {
  firstName: string;
  lastName: string;
  uniqueId: string;
  organizationId?: string;
  organizationName?: string;
  walletAddress: string;
  createdAt: string;
}

const ProfileInfo = ({
  firstName,
  lastName,
  uniqueId,
  organizationId,
  organizationName,
  walletAddress,
  createdAt,
}: ProfileInfoProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {/* Header with Avatar */}
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mr-4">
          <span className="text-white font-bold text-xl">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">
            {firstName} {lastName}
          </h2>
          <p className="text-orange-500 font-medium">@{uniqueId}</p>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-3 border-b border-neutral-200 pb-2">
            Personal Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Full Name
              </label>
              <p className="text-neutral-800 font-medium">
                {firstName} {lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Unique ID
              </label>
              <p className="text-neutral-800 font-medium font-mono">
                @{uniqueId}
              </p>
            </div>
          </div>
        </div>

        {/* Organization & Account Info */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-3 border-b border-neutral-200 pb-2">
            Organization & Account
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Organization
              </label>
              {organizationId ? (
                <div>
                  <p className="text-neutral-800 font-medium">
                    {organizationName}
                  </p>
                  <p className="text-neutral-500 text-sm font-mono">
                    ({organizationId})
                  </p>
                </div>
              ) : (
                <p className="text-neutral-500 italic">No organization</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Member Since
              </label>
              <p className="text-neutral-800 font-medium">
                {formatDate(createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <label className="block text-sm font-medium text-neutral-500 mb-2">
          Wallet Address
        </label>
        <p className="font-mono text-sm text-neutral-800 break-all bg-neutral-50 p-3 rounded-lg">
          {walletAddress}
        </p>
      </div>
    </div>
  );
};

export default ProfileInfo;
