import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import ProfileInfo from "../components/profile/ProfileInfo";

interface UserProfile {
  wallet_address: string;
  unique_id: string;
  first_name: string;
  last_name: string;
  organization_id?: string;
  organizations?: {
    organization_name: string;
  };
  created_at: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          "http://localhost:8080/api/user/profile"
        );

        const data = await response.json();

        if (response.ok && data.exists) {
          setProfile(data.user);
        } else {
          setError("Profile not found");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Profile Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-neutral-800 mb-2">
            No Profile Found
          </h2>
          <p className="text-neutral-600">Your profile could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8"></div>

        {/* Profile Content - Single centered card */}
        <div className="mb-8">
          <ProfileInfo
            firstName={profile.first_name}
            lastName={profile.last_name}
            uniqueId={profile.unique_id}
            organizationId={profile.organization_id}
            organizationName={profile.organizations?.organization_name}
            walletAddress={profile.wallet_address}
            createdAt={profile.created_at}
          />
        </div>

        {/* Information Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
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
                Profile Information
              </h4>
              <p className="text-blue-700 text-sm">
                Your profile information is permanent and cannot be modified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
