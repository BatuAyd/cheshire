import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface SetupGuardProps {
  children: React.ReactNode;
}

const SetupGuard = ({ children }: SetupGuardProps) => {
  const { isAuthenticated, isAuthenticating, userExists, isCheckingUser } =
    useAuthStore();

  // Debug logging to see what's happening
  console.log("🔍 SetupGuard state:", {
    isAuthenticated,
    isAuthenticating,
    userExists,
    isCheckingUser,
  });

  // Show loading while checking authentication or user existence
  if (isAuthenticating || isCheckingUser) {
    console.log("⏳ SetupGuard - Loading auth/user state...");
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  // Not authenticated → redirect to home
  if (!isAuthenticated) {
    console.log("❌ SetupGuard - Not authenticated");
    return <Navigate to="/" replace />;
  }

  // User already exists → redirect to profile (setup already completed)
  if (userExists) {
    console.log("↩️ SetupGuard - User already exists, redirecting to profile");
    return <Navigate to="/profile" replace />;
  }

  // Authenticated but user doesn't exist → show setup page
  console.log(
    "✅ SetupGuard - Authenticated but user doesn't exist, showing setup page"
  );
  return <>{children}</>;
};

export default SetupGuard;
