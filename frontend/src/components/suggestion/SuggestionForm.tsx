import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../utils/api";
import type { Proposal } from "../../utils/proposalUtils";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Types
interface Category {
  category_id: string;
  title: string;
  created_by: string;
}

interface OrganizationUser {
  unique_id: string;
  first_name: string;
  last_name: string;
}

interface SuggestionFormProps {
  proposal: Proposal;
  onClose: () => void;
  onSuccess: () => void;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({
  proposal,
  onClose,
  onSuccess,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    category_id: "",
    suggestion_type: "vote_option" as "vote_option" | "delegate",
    target_option_number: 1,
    target_user: "",
  });

  // Data loading states
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<
    OrganizationUser[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Show modal with animation
  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Load user's categories
  useEffect(() => {
    const loadUserCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiFetch(
          `${API_BASE}/api/categories/organization?limit=200&offset=0`
        );

        if (response.ok) {
          const data = await response.json();
          // Only show categories created by the current user
          // Note: We'll need to get current user's wallet address to filter properly
          // For now, we'll show all categories and let the backend validate ownership
          setUserCategories(data.categories || []);

          // Auto-select first category if available
          if (data.categories && data.categories.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category_id: data.categories[0].category_id,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadUserCategories();
  }, []);

  // Load organization users for delegation suggestions
  useEffect(() => {
    const loadOrganizationUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await apiFetch(
          `${API_BASE}/api/user/organization/users`
        );

        if (response.ok) {
          const data = await response.json();
          setOrganizationUsers(data.users || []);
        }
      } catch (error) {
        console.error("Error loading organization users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadOrganizationUsers();
  }, []);

  // Form validation
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!formData.category_id) {
      errors.push("Please select a category");
    }

    if (formData.suggestion_type === "vote_option") {
      if (!formData.target_option_number || formData.target_option_number < 1) {
        errors.push("Please select a valid voting option");
      }
    }

    if (formData.suggestion_type === "delegate") {
      if (!formData.target_user.trim()) {
        errors.push("Please select or enter a user to delegate to");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [formData]);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      return;
    }

    try {
      setSubmitting(true);

      // Prepare request body based on suggestion type
      const suggestionPayload = {
        proposal_id: proposal.proposal_id,
        suggestion_type: formData.suggestion_type, // Now sends 'delegate' or 'vote_option'
        ...(formData.suggestion_type === "delegate" && {
          target_user: formData.target_user,
        }),
        ...(formData.suggestion_type === "vote_option" && {
          // ✅ FIXED: "vote_option"
          target_option_number: formData.target_option_number,
        }),
      };

      const response = await apiFetch(
        `${API_BASE}/api/categories/${formData.category_id}/suggest`,
        {
          method: "POST",
          body: JSON.stringify(suggestionPayload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Suggestion created:", data.suggestion);
        onSuccess();
      } else {
        console.error("❌ Failed to create suggestion:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

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
        className={`relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10"
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

        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Create Suggestion
          </h2>
          <p className="text-neutral-600">
            Provide a voting or delegation suggestion for:{" "}
            <span className="font-medium">"{proposal.title}"</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Category *
              </label>
              {loadingCategories ? (
                <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
              ) : userCategories.length === 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    You don't have any categories yet. Create a category first
                    to make suggestions.
                  </p>
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    handleInputChange("category_id", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                >
                  <option value="">Choose a category...</option>
                  {userCategories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Suggestion Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Suggestion Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="radio"
                    name="suggestion_type"
                    value="vote_option"
                    checked={formData.suggestion_type === "vote_option"}
                    onChange={(e) =>
                      handleInputChange("suggestion_type", e.target.value)
                    }
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-neutral-800">
                      Vote for Option
                    </div>
                    <div className="text-sm text-neutral-600">
                      Recommend a specific choice
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="radio"
                    name="suggestion_type"
                    value="delegate"
                    checked={formData.suggestion_type === "delegate"}
                    onChange={(e) =>
                      handleInputChange("suggestion_type", e.target.value)
                    }
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-neutral-800">
                      Delegate to User
                    </div>
                    <div className="text-sm text-neutral-600">
                      Let someone else decide
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Voting Option Selection */}
            {formData.suggestion_type === "vote_option" && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Recommended Option *
                </label>
                <div className="space-y-2">
                  {proposal.options?.map((option) => (
                    <label
                      key={option.option_number}
                      className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="target_option"
                        value={option.option_number}
                        checked={
                          formData.target_option_number === option.option_number
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "target_option_number",
                            parseInt(e.target.value)
                          )
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-neutral-800">
                          Option {option.option_number}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {option.option_text}
                        </div>
                      </div>
                    </label>
                  )) || (
                    <p className="text-neutral-500 italic">
                      No voting options available
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* User Selection for Delegation */}
            {formData.suggestion_type === "delegate" && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Delegate to User *
                </label>
                {loadingUsers ? (
                  <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={formData.target_user}
                      onChange={(e) =>
                        handleInputChange("target_user", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Choose a user...</option>
                      {organizationUsers.map((user) => (
                        <option key={user.unique_id} value={user.unique_id}>
                          {user.first_name} {user.last_name} (@{user.unique_id})
                        </option>
                      ))}
                    </select>

                    <div className="text-sm text-neutral-600">
                      Or enter a unique ID manually:
                    </div>

                    <input
                      type="text"
                      value={formData.target_user}
                      onChange={(e) =>
                        handleInputChange("target_user", e.target.value)
                      }
                      placeholder="e.g., alice123"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Validation Errors */}
            {!validation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">
                  Please fix these errors:
                </h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                    About Suggestions
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Your suggestion will be visible to all users who follow your
                    category. Suggestions cannot be created within 1 hour of the
                    voting deadline.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-6 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  !validation.isValid ||
                  userCategories.length === 0
                }
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  submitting ||
                  !validation.isValid ||
                  userCategories.length === 0
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md active:scale-95 cursor-pointer"
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Creating Suggestion...
                  </div>
                ) : (
                  "Create Suggestion"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestionForm;
