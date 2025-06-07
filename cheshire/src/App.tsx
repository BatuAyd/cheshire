// External Libraries
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Configuration
import { config, queryClient } from "./config/wagmiRainbowKitConfig";

// Hooks
import { useJWTAuthSync } from "./store/supabaseAuthStore";
import { useWalletAuthSync } from "./hooks/useWalletAuthSync";

// Components
import Navbar from "./components/navigation/Navbar";
import Footer from "./components/navigation/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SetupGuard from "./components/setup/SetupGuard";

// Pages
import SetupPage from "./pages/SetupPage";
import ProfilePage from "./pages/ProfilePage";
import CreateProposalPage from "./pages/CreateProposalPage";
import ProposalsPage from "./pages/ProposalsPage";
import ProposalDetailPage from "./pages/ProposalDetailPage";
import AboutPage from "./pages/AboutPage";
import StatusPage from "./pages/StatusPage";
import LandingPage from "./pages/LandingPage";

const CategoriesPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Categories</h1>
    <p className="mb-4">This is a protected page for viewing categories.</p>
    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
      <p className="text-green-800">You are successfully authenticated! 🎉</p>
    </div>
    <p>This page would list all available categories for proposals.</p>
  </div>
);

const NotFoundPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
  </div>
);

// Component with auth sync
const AuthSyncWrapper = ({ children }: { children: React.ReactNode }) => {
  useJWTAuthSync(); // JWT auth initialization
  useWalletAuthSync(); // Wallet state sync
  return <>{children}</>;
};

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AuthSyncWrapper>
            <Router>
              {/* Flex container for sticky footer */}
              <div className="flex flex-col min-h-screen">
                {/* Navbar appears on every page */}
                <Navbar />

                {/* Main content with flex-1 to expand and push footer down */}
                <main className="container mx-auto px-4 pt-20 flex-1">
                  <Routes>
                    {/* Public routes - accessible to everyone */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/status" element={<StatusPage />} />

                    {/* Setup route - authenticated users only, before profile creation */}
                    <Route
                      path="/setup"
                      element={
                        <SetupGuard>
                          <SetupPage />
                        </SetupGuard>
                      }
                    />

                    {/* Protected routes - require authentication + completed profile */}
                    <Route
                      path="/proposals"
                      element={
                        <ProtectedRoute>
                          <ProposalsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Individual proposal route */}
                    <Route
                      path="/proposal/:id"
                      element={
                        <ProtectedRoute>
                          <ProposalDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/categories"
                      element={
                        <ProtectedRoute>
                          <CategoriesPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Profile route */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Create Proposal route */}
                    <Route
                      path="/create-proposal"
                      element={
                        <ProtectedRoute>
                          <CreateProposalPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Not Found route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>

                {/* Footer appears on every page and sticks to bottom */}
                <Footer />
              </div>
            </Router>
          </AuthSyncWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
