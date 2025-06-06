import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { apiFetch } from "../../utils/api";
import { useSupabaseAuthStore } from "../../store/supabaseAuthStore";

const UserSetupSimple = () => {
  const navigate = useNavigate();
  const { address } = useAccount();

  const [formData, setFormData] = useState({
    unique_id: "",
    first_name: "",
    last_name: "",
    organization_id: "",
  });

  const [validation, setValidation] = useState({
    unique_id: { available: false, checking: false, message: "" },
    organization: { exists: false, checking: false, message: "" },
  });

  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Load organizations on mount
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/user/organizations"
        );
        const data = await response.json();
        if (response.ok) {
          setOrganizations(data.organizations || []);
        }
      } catch (error) {
        console.error("Error loading organizations:", error);
      }
    };
    loadOrgs();
  }, []);

  // Check unique_id availability
  useEffect(() => {
    if (formData.unique_id.length > 0) {
      const timer = setTimeout(async () => {
        // Validate format first
        const pattern = /^[a-zA-Z0-9_]+$/;
        if (
          !pattern.test(formData.unique_id) ||
          formData.unique_id.length > 16
        ) {
          setValidation((prev) => ({
            ...prev,
            unique_id: {
              available: false,
              checking: false,
              message: "Only letters, numbers, and underscores (max 16 chars)",
            },
          }));
          return;
        }

        setValidation((prev) => ({
          ...prev,
          unique_id: { ...prev.unique_id, checking: true },
        }));

        try {
          const response = await fetch(
            `http://localhost:8080/api/user/unique-id/check?id=${formData.unique_id}`
          );
          const data = await response.json();

          setValidation((prev) => ({
            ...prev,
            unique_id: {
              available: data.available,
              checking: false,
              message: data.available ? "Available!" : "Already taken",
            },
          }));
        } catch (error) {
          setValidation((prev) => ({
            ...prev,
            unique_id: {
              available: false,
              checking: false,
              message: "Error checking",
            },
          }));
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setValidation((prev) => ({
        ...prev,
        unique_id: { available: false, checking: false, message: "" },
      }));
    }
  }, [formData.unique_id]);

  // Check organization existence
  useEffect(() => {
    if (formData.organization_id.length > 0) {
      const timer = setTimeout(async () => {
        setValidation((prev) => ({
          ...prev,
          organization: { ...prev.organization, checking: true },
        }));

        try {
          const response = await fetch(
            `http://localhost:8080/api/user/organization/check?id=${formData.organization_id}`
          );
          const data = await response.json();

          setValidation((prev) => ({
            ...prev,
            organization: {
              exists: data.exists,
              checking: false,
              message: data.exists
                ? "Organization found"
                : "Organization not found",
            },
          }));
        } catch (error) {
          setValidation((prev) => ({
            ...prev,
            organization: {
              exists: false,
              checking: false,
              message: "Error checking",
            },
          }));
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setValidation((prev) => ({
        ...prev,
        organization: { exists: false, checking: false, message: "" },
      }));
    }
  }, [formData.organization_id]);

  const isFormValid = () => {
    return (
      formData.first_name.trim().length >= 2 &&
      formData.last_name.trim().length >= 2 &&
      validation.unique_id.available &&
      formData.organization_id.trim().length > 0 && // Required
      validation.organization.exists
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert("Please fix form errors before submitting");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare request body - include wallet address since we might not have JWT yet
      const requestBody = {
        ...formData,
        wallet_address: address, // Include wallet address for user creation
      };

      const response = await apiFetch("http://localhost:8080/api/user/create", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ User created:", data.user);

        // Update auth store to reflect user now exists
        useSupabaseAuthStore.getState().setUserExists(true);

        console.log("🔄 User profile created, redirecting to signin...");

        // Redirect to home for sign in (user needs to authenticate to get JWT)
        navigate("/", { replace: true });

        // Show success message
        alert("Profile created successfully! Please sign in to continue.");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-neutral-600">
            Set up your profile to start participating in liquid voting. This
            information cannot be changed after creation.
          </p>
          {address && (
            <p className="text-sm text-neutral-500 mt-2">
              Wallet: <span className="font-mono">{address}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                placeholder="Enter your first name"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
              {formData.first_name.trim().length > 0 &&
                formData.first_name.trim().length < 2 && (
                  <p className="text-red-600 text-sm mt-1">
                    Must be at least 2 characters
                  </p>
                )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                placeholder="Enter your last name"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
              {formData.last_name.trim().length > 0 &&
                formData.last_name.trim().length < 2 && (
                  <p className="text-red-600 text-sm mt-1">
                    Must be at least 2 characters
                  </p>
                )}
            </div>

            {/* Unique ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Unique ID *
                <span className="text-xs text-neutral-500 ml-2">
                  (for delegation - max 16 chars, letters/numbers/underscores
                  only)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.unique_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unique_id: e.target.value,
                    }))
                  }
                  placeholder="e.g., alice123, john_doe"
                  maxLength={16}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    validation.unique_id.available
                      ? "border-green-300 bg-green-50"
                      : "border-neutral-300"
                  }`}
                  required
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validation.unique_id.checking && (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-400"></div>
                  )}
                  {!validation.unique_id.checking && formData.unique_id && (
                    <span
                      className={
                        validation.unique_id.available
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {validation.unique_id.available ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              </div>
              {validation.unique_id.message && (
                <p
                  className={`text-sm mt-1 ${
                    validation.unique_id.available
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {validation.unique_id.message}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                {formData.unique_id.length}/16 characters
              </p>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Organization ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.organization_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      organization_id: e.target.value,
                    }))
                  }
                  placeholder="e.g., bilgi_university, fens, cmpe"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    validation.organization.exists
                      ? "border-green-300 bg-green-50"
                      : "border-neutral-300"
                  }`}
                  required
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validation.organization.checking && (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-400"></div>
                  )}
                  {!validation.organization.checking &&
                    formData.organization_id && (
                      <span
                        className={
                          validation.organization.exists
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {validation.organization.exists ? "✓" : "✗"}
                      </span>
                    )}
                </div>
              </div>
              {validation.organization.message && (
                <p
                  className={`text-sm mt-1 ${
                    validation.organization.exists
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {validation.organization.message}
                </p>
              )}

              {/* Organization suggestions */}
              {organizations.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-neutral-500 mb-1">
                    Available organizations:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {organizations.map((org: any) => (
                      <button
                        key={org.organization_id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            organization_id: org.organization_id,
                          }))
                        }
                        className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200 transition-colors"
                      >
                        {org.organization_id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                submitting || !isFormValid()
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md active:scale-95"
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Creating Profile...
                </div>
              ) : (
                "Create Profile"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSetupSimple;
