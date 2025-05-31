import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { config, queryClient } from "./config/wagmiRainbowKitConfig";
import Navbar from "./components/Navbar";
import { useAuthSync } from "./store/authStore";
import { useWalletAuthSync } from "./hooks/useWalletAuthSync";
import ProtectedRoute from "./components/ProtectedRoute";

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

// New Profile Page component
const ProfilePage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">User Profile</h1>
    <p className="mb-4">This is your user profile page.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-neutral-800">
          Wallet Information
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-neutral-500">Connected Address</p>
            <p className="font-mono text-sm break-all">0x123...abc</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Network</p>
            <p>Sepolia Testnet</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-neutral-800">Activity</h2>
        <p className="text-neutral-600">No recent activity to display.</p>
      </div>
    </div>
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

                  {/* New Profile route */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
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
