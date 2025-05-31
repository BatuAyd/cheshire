import { useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useAuthStore } from "../store/authStore";

const CustomSignIn = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, logout } = useAuthStore();
  const { signMessageAsync } = useSignMessage();

  const handleSignIn = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);

      // Step 1: Get nonce from server
      const nonceResponse = await fetch("http://localhost:8080/api/nonce");
      const { nonce } = await nonceResponse.json();

      // Step 2: Create message
      const message = `Sign this message to authenticate with Cheshire.\n\nAddress: ${address}\nNonce: ${nonce}`;

      // Step 3: Sign message
      const signature = await signMessageAsync({ message });

      // Step 4: Verify signature with server
      const verifyResponse = await fetch("http://localhost:8080/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message, signature }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.ok) {
        // Immediately update auth store (no server call needed)
        useAuthStore.getState().setAuthenticated(true, address);
        console.log("✅ Signed in successfully - state updated immediately");
      } else {
        console.error("Verification failed:", verifyData.error);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout(); // This already clears cache
      disconnect();
      console.log("✅ Signed out successfully - cache cleared");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't show anything if not connected
  if (!isConnected) return null;

  // Show the sign-out button if already authenticated
  if (isAuthenticated) {
    return (
      <button
        onClick={handleSignOut}
        className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 font-medium transition-all hover:bg-neutral-300 active:scale-95 flex items-center gap-2"
      >
        <span>Sign Out</span>
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
