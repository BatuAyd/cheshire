import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuthStore } from "../store/authStore";
import CustomSignIn from "./CustomSignIn";

const Navbar = () => {
  // State to track scroll position for blur effect
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Get auth state from Zustand store
  const { isAuthenticated } = useAuthStore();

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
            <NavLink to="/voting" active={location.pathname === "/voting"}>
              Vote
            </NavLink>
            <NavLink
              to="/proposals"
              active={location.pathname === "/proposals"}
            >
              Proposals
            </NavLink>
            <NavLink
              to="/create-proposal"
              active={location.pathname === "/create-proposal"}
            >
              Create Proposal
            </NavLink>
          </div>
        )}
      </div>

      {/* Right side: Connect/Sign buttons */}
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

                  return (
                    <div className="flex items-center gap-2">
                      {/* Custom Sign In Button */}
                      <CustomSignIn />

                      {/* Profile Button (replaces Account Button) */}
                      <button
                        onClick={() => navigate("/profile")}
                        type="button"
                        className="px-4 py-2 rounded-lg bg-orange-400 text-white font-medium transition-all hover:shadow-md hover:bg-orange-500 active:scale-95 select-none cursor-pointer"
                      >
                        Profile
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
