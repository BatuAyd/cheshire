import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../utils/api";
import type { Proposal } from "../../utils/proposalUtils";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

interface DelegateModalProps {
  proposal: Proposal;
  currentDelegate?: {
    unique_id: string;
    name: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrganizationUser {
  unique_id: string;
  first_name: string;
  last_name: string;
}

const DelegateModal: React.FC<DelegateModalProps> = ({
  proposal,
  currentDelegate,
  onClose,
  onSuccess,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetUser, setTargetUser] = useState(
    currentDelegate?.unique_id || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [organizationUsers, setOrganizationUsers] = useState<
    OrganizationUser[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Show modal with animation
  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Load organization users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await apiFetch(
          `${API_BASE}/api/user/organization/users`
        );

        if (response.ok) {
          const data = await response.json();
          setOrganizationUsers(data.users || []);
        } else {
          console.warn("Failed to load organization users");
          setOrganizationUsers([]);
        }
      } catch (error) {
        console.warn("Error loading organization users:", error);
        setOrganizationUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on input
  const filteredUsers = useMemo(() => {
    if (!targetUser.trim()) return [];

    const query = targetUser.toLowerCase();
    return organizationUsers
      .filter((user) => {
        const uniqueId = user.unique_id.toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return uniqueId.includes(query) || fullName.includes(query);
      })
      .slice(0, 5); // Limit to 5 suggestions
  }, [targetUser, organizationUsers]);

  // Validate target user
  const validation = useMemo(() => {
    if (!targetUser.trim()) {
      return { valid: false, message: "Please enter a username" };
    }

    const trimmed = targetUser.trim();
    const userExists = organizationUsers.some(
      (user) => user.unique_id.toLowerCase() === trimmed.toLowerCase()
    );

    if (!userExists) {
      return { valid: false, message: "User not found in your organization" };
    }

    return { valid: true, message: "Valid user" };
  }, [targetUser, organizationUsers]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleInputChange = (value: string) => {
    setTargetUser(value);
    setShowDropdown(value.trim().length > 0);
  };

  const handleUserSelect = (user: OrganizationUser) => {
    setTargetUser(user.unique_id);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.valid || submitting) return;

    try {
      setSubmitting(true);

      const response = await apiFetch(
        `${API_BASE}/api/proposals/${proposal.proposal_id}/delegate`,
        {
          method: "POST",
          body: JSON.stringify({
            target_user: targetUser.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const targetUserData = organizationUsers.find(
          (user) =>
            user.unique_id.toLowerCase() === targetUser.trim().toLowerCase()
        );
        const targetName = targetUserData
          ? `${targetUserData.first_name} ${targetUserData.last_name}`
          : targetUser.trim();

        // Show success message
        console.log(
          `✅ Successfully delegated to ${targetName} (@${targetUser.trim()})`
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
        } else if (
          response.status === 400 &&
          data.error?.includes("Delegation not allowed")
        ) {
          alert(`🚫 ${data.error}`);
        } else if (response.status === 410) {
          alert("⏰ Voting period has ended for this proposal.");
        } else if (response.status === 404) {
          alert("❌ Target user not found in your organization.");
        } else {
          alert(`❌ Failed to delegate: ${data.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error delegating vote:", error);
      alert(
        `❌ Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUserData = organizationUsers.find(
    (user) => user.unique_id.toLowerCase() === targetUser.trim().toLowerCase()
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
              Delegate Your Vote
            </h2>
            <p className="text-neutral-600">
              Choose someone you trust to vote on "{proposal.title}" for you
            </p>
            {currentDelegate && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <span className="font-medium">Currently delegated to:</span> @
                  {currentDelegate.unique_id} ({currentDelegate.name})
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* User Search Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Delegate to (username):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetUser}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => setShowDropdown(targetUser.trim().length > 0)}
                  placeholder="Enter username (e.g., alice, john.doe)"
                  disabled={submitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors ${
                    targetUser && !validation.valid
                      ? "border-red-300 bg-red-50"
                      : "border-neutral-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />

                {/* User Suggestions Dropdown */}
                {showDropdown && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.unique_id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-neutral-800">
                          @{user.unique_id}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {user.first_name} {user.last_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading indicator */}
                {loadingUsers && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-4 h-4 animate-spin text-neutral-400"
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
                  </div>
                )}
              </div>

              {/* Validation message */}
              {targetUser && (
                <p
                  className={`mt-2 text-sm ${
                    validation.valid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {validation.message}
                </p>
              )}
            </div>

            {/* Selected user preview */}
            {selectedUserData && validation.valid && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-800 font-medium mb-1">
                  You're delegating to:
                </h4>
                <div className="text-blue-700 text-sm">
                  <div className="font-medium">
                    @{selectedUserData.unique_id}
                  </div>
                  <div>
                    {selectedUserData.first_name} {selectedUserData.last_name}
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h4 className="text-neutral-800 font-medium mb-2">
                About delegation:
              </h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Your vote will be cast by the person you delegate to</li>
                <li>• You can change or remove your delegation at any time</li>
                <li>
                  • If you vote directly later, your delegation will be
                  automatically removed
                </li>
              </ul>
            </div>

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
                disabled={submitting || !validation.valid}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  submitting || !validation.valid
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
                    Delegating...
                  </span>
                ) : currentDelegate ? (
                  "Update Delegation"
                ) : (
                  "Delegate Vote"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DelegateModal;
