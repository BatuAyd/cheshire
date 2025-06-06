import { useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import {
  useSupabaseAuthStore,
  useSupabaseAuthActions,
} from "../../store/supabaseAuthStore";

const CustomSignIn = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, userExists, isCheckingUser } =
    useSupabaseAuthStore();
  const { logout, checkUserStatus, signIn } = useSupabaseAuthActions();
  const { signMessageAsync } = useSignMessage();

  const handleSignIn = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);

      // First check if user has completed profile setup
      console.log("🔍 Checking user status before signin...");
      const userStatus = await checkUserStatus(address);

      if (!userStatus.exists) {
        console.log("👤 User needs to complete profile setup");
        alert(
          "Please complete your profile setup first by going to the Setup page."
        );
        setLoading(false);
        return;
      }

      // User exists, proceed with JWT authentication
      console.log("🔐 User exists, proceeding with JWT signin...");

      // Step 1: Get nonce from server
      const nonceResponse = await fetch("http://localhost:8080/api/auth/nonce");
      const { nonce } = await nonceResponse.json();

      // Step 2: Create message
      const message = `Sign this message to authenticate with Cheshire.\n\nAddress: ${address}\nChain ID: 1\nNonce: ${nonce}`;

      // Step 3: Sign message
      const signature = await signMessageAsync({ message });

      // Step 4: Attempt JWT signin
      const signInResult = await signIn(address, message, signature);

      if (signInResult.success) {
        console.log("✅ JWT signin successful - authenticated!");
      } else {
        console.error("❌ JWT signin failed:", signInResult.error);
        if (signInResult.error?.includes("Profile setup required")) {
          alert("Please complete your profile setup first.");
        } else {
          alert(`Sign in failed: ${signInResult.error}`);
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logout();
      disconnect();
      console.log("✅ Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if not connected
  if (!isConnected) return null;

  // Show loading if checking user status
  if (isCheckingUser) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg bg-neutral-300 text-neutral-500 font-medium cursor-not-allowed"
      >
        Checking...
      </button>
    );
  }

  // Show the sign-out button if already authenticated
  if (isAuthenticated) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`px-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 font-medium transition-all flex items-center gap-2 ${
          loading
            ? "opacity-70 cursor-not-allowed"
            : "hover:bg-neutral-300 active:scale-95"
        }`}
      >
        <span>{loading ? "Signing out..." : "Sign Out"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    );
  }

  // Show different states based on user profile status
  if (userExists === false) {
    // User doesn't have profile, show setup prompt
    return (
      <button
        onClick={() => (window.location.href = "/setup")}
        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium transition-all hover:bg-orange-600 active:scale-95"
      >
        Complete Setup
      </button>
    );
  }

  // Show the sign-in button if connected but not authenticated
  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`px-4 py-2 rounded-lg bg-green-500 text-white font-medium transition-all ${
        loading
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-green-600 active:scale-95"
      }`}
    >
      {loading ? "Signing..." : "Sign In"}
    </button>
  );
};

export default CustomSignIn;
