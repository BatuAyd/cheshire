import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useDisconnect } from "wagmi";
import {
  useSupabaseAuthStore,
  useSupabaseAuthActions,
} from "../../store/supabaseAuthStore";
import CustomSignIn from "../auth/CustomSignIn";

const Navbar = () => {
  // State to track scroll position for blur effect
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Get auth state from JWT store
  const { isAuthenticated } = useSupabaseAuthStore();
  const { logout } = useSupabaseAuthActions();

  // Get disconnect function
  const { disconnect } = useDisconnect();

  // Get current location for active link highlighting
  const location = useLocation();

  // Navigation hook
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const handleDisconnect = () => {
    disconnect();
    console.log("Wallet disconnected");
  };

  const handleSignOut = async () => {
    try {
      await logout();
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between transition-all duration-300 z-50 ${
        scrolled ? "bg-white/50 backdrop-blur-md shadow-sm" : "bg-white/80"
      }`}
    >
      {/* Brand/Logo - Left side */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center select-none ml-2">
          <h1
            className="text-xl md:text-3xl font-semibold text-neutral-800"
            style={{ fontFamily: "'STIX Two Text', serif", fontWeight: 600 }}
          >
            <span className="text-orange-400">Cheshire</span>
          </h1>
        </Link>

        {/* Navigation Links - Show only when authenticated */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center ml-8 space-x-6">
            <NavLink
              to="/proposals"
              active={location.pathname === "/proposals"}
            >
              Proposals
            </NavLink>
            <NavLink
              to="/categories"
              active={location.pathname === "/categories"}
            >
              Categories
            </NavLink>
          </div>
        )}
      </div>

      {/* Right side: Connect/Sign/Profile buttons */}
      <div className="flex items-center gap-3">
        {/* Connect Wallet Button */}
        <ConnectButton.Custom>
          {({ account, chain, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
                className="flex gap-3"
              >
                {(() => {
                  // Not connected - show Connect Wallet button
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="px-4 py-2 rounded-lg bg-orange-400 text-white font-medium transition-all hover:shadow-md hover:bg-orange-500 active:scale-95 select-none cursor-pointer"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  // Connected but wrong network
                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium transition-all hover:shadow-md hover:bg-red-600 active:scale-95"
                      >
                        Wrong Network
                      </button>
                    );
                  }

                  // Connected and correct network but not authenticated
                  if (!isAuthenticated) {
                    // Show Sign In + Disconnect buttons
                    return (
                      <div className="flex items-center gap-3">
                        {/* Sign In Button - CustomSignIn handles the logic */}
                        <CustomSignIn />

                        {/* Disconnect Button */}
                        <button
                          onClick={handleDisconnect}
                          className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 font-medium transition-all hover:bg-neutral-300 active:scale-95 flex items-center gap-2"
                        >
                          <span>Disconnect</span>
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  }

                  // Authenticated - show Profile + Sign Out
                  return (
                    <div className="flex items-center gap-3">
                      {/* Profile Button */}
                      <button
                        onClick={() => navigate("/profile")}
                        type="button"
                        className="px-4 py-2 rounded-lg bg-orange-400 text-white font-medium transition-all hover:shadow-md hover:bg-orange-500 active:scale-95 select-none cursor-pointer"
                      >
                        Profile
                      </button>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 font-medium transition-all hover:bg-neutral-300 active:scale-95 flex items-center gap-2 cursor-pointer"
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
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
};

// Navigation link component
interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

const NavLink = ({ to, active, children }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={`font-medium transition-colors ${
        active ? "text-orange-500" : "text-neutral-600 hover:text-orange-500"
      }`}
    >
      {children}
    </Link>
  );
};

export default Navbar;
