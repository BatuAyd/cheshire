// External Libraries
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Configuration
import { config, queryClient } from "./config/wagmiRainbowKitConfig";

// Hooks
import { useAuthSync } from "./store/authStore";
import { useWalletAuthSync } from "./hooks/useWalletAuthSync";

// Components
import Navbar from "./components/navigation/Navbar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SetupGuard from "./components/setup/SetupGuard";

// Pages
import SetupPage from "./pages/SetupPage";
import ProfilePage from "./pages/ProfilePage";
import CreateProposalPage from "./pages/CreateProposalPage";

// Placeholder page components
const LandingPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Welcome to Cheshire</h1>
    <p className="mb-4">
      This is the public landing page that anyone can access.
    </p>
    <p>Connect your wallet and sign in to access the full application.</p>

    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
      <h2 className="text-xl font-semibold text-blue-700 mb-2">
        Getting Started
      </h2>
      <ol className="list-decimal ml-6 space-y-2 text-blue-800">
        <li>Click the "Connect" button in the top right</li>
        <li>Select your wallet (MetaMask, Coinbase Wallet, etc.)</li>
        <li>After connecting, click the "Sign In" button</li>
        <li>Sign the authentication message in your wallet</li>
        <li>Once authenticated, you'll have access to protected pages</li>
      </ol>
    </div>
  </div>
);

const ProposalsPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Proposals</h1>
    <p className="mb-4">This is a protected page for viewing proposals.</p>
    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
      <p className="text-green-800">You are successfully authenticated! 🎉</p>
    </div>
    <p>This page would list all active and past proposals.</p>

    {/* Temporary Create Proposal Button - will be replaced with proper navigation later */}
    <div className="mt-6">
      <a
        href="/create-proposal"
        className="inline-flex items-center px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create New Proposal
      </a>
    </div>
  </div>
);

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
  useAuthSync(); // Existing auth sync
  useWalletAuthSync(); // New wallet sync
  return <>{children}</>;
};

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AuthSyncWrapper>
            <Router>
              {/* Navbar appears on every page */}
              <Navbar />

              {/* Main content with padding to account for fixed navbar */}
              <main className="container mx-auto px-4 pt-20">
                <Routes>
                  {/* Public route - accessible to everyone */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Setup route - authenticated users only, before profile creation */}
                  <Route
                    path="/setup"
                    element={
                      <SetupGuard>
                        <SetupPage />
                      </SetupGuard>
                    }
                  />

                  {/* Protected routes - require authentication */}
                  <Route
                    path="/proposals"
                    element={
                      <ProtectedRoute>
                        <ProposalsPage />
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
            </Router>
          </AuthSyncWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
