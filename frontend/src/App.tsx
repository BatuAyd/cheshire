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
import { Navbar, Footer } from "./components/navigation";
import { ProtectedRoute } from "./components/auth";
import { SetupGuard } from "./components/setup";

// Pages
import {
  LandingPage,
  AboutPage,
  StatusPage,
  SetupPage,
  ProposalsPage,
  ProposalDetailPage,
  CategoriesPage,
  ProfilePage,
  CreateProposalPage,
  NotFoundPage,
} from "./pages";

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
