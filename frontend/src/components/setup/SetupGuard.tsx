import { Navigate } from "react-router-dom";
import { useSupabaseAuthStore } from "../../store/supabaseAuthStore";
import { useAccount } from "wagmi";

interface SetupGuardProps {
  children: React.ReactNode;
}

const SetupGuard = ({ children }: SetupGuardProps) => {
  const { isConnected, address } = useAccount();
  const { isAuthenticated, isAuthenticating, userExists, isCheckingUser } =
    useSupabaseAuthStore();

  // Debug logging
  console.log("🔍 SetupGuard state:", {
    isConnected,
    address,
    isAuthenticated,
    isAuthenticating,
    userExists,
    isCheckingUser,
  });

  // Show loading while checking user status
  if (isCheckingUser || isAuthenticating) {
    console.log("⏳ SetupGuard - Loading user/auth state...");
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  // Wallet not connected → redirect to home
  if (!isConnected || !address) {
    console.log("❌ SetupGuard - Wallet not connected");
    return <Navigate to="/" replace />;
  }

  // User already authenticated → redirect to main app
  if (isAuthenticated && userExists) {
    console.log("↩️ SetupGuard - User already authenticated and has profile");
    return <Navigate to="/proposals" replace />;
  }

  // User already exists but not authenticated → redirect to home for signin
  if (userExists && !isAuthenticated) {
    console.log(
      "↩️ SetupGuard - User exists but not authenticated, redirect to signin"
    );
    return <Navigate to="/" replace />;
  }

  // Connected wallet + no user profile (or profile check in progress) → show setup page
  console.log("✅ SetupGuard - Wallet connected, user needs setup");
  return <>{children}</>;
};

export default SetupGuard;
