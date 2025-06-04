import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthenticating, userExists, userAddress } =
    useAuthStore();
  const location = useLocation();

  // Check if user exists when authenticated
  useEffect(() => {
    const checkUser = async () => {
      if (isAuthenticated && userAddress && !userExists) {
        try {
          const response = await fetch(
            `http://localhost:8080/api/user/exists?address=${userAddress}`
          );
          const data = await response.json();
          useAuthStore.getState().setUserExists(data.exists || false);
        } catch (error) {
          console.error("Error checking user existence:", error);
        }
      }
    };
    checkUser();
  }, [isAuthenticated, userAddress, userExists]);

  // Show loading while checking authentication
  if (isAuthenticating) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  // Not authenticated → redirect to home
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but no user profile → redirect to setup
  if (!userExists) {
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;
  }

  // Authenticated AND has profile → show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
