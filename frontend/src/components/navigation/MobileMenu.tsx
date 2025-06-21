import React from "react";
import { Link, useLocation } from "react-router-dom";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
}) => {
  const location = useLocation();

  const handleLinkClick = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={handleBackdropClick}
      />

      {/* Menu Content */}
      <div
        className={`fixed top-0 left-0 w-64 h-screen bg-white/95 backdrop-blur-md shadow-lg border-r border-neutral-200 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {isAuthenticated && (
          <div className="px-6 py-6 pt-20">
            <div className="h-px bg-neutral-200 mb-2"></div>
            <Link
              to="/proposals"
              onClick={handleLinkClick}
              className={`block py-4 px-4 rounded-lg font-medium transition-colors text-lg ${
                location.pathname === "/proposals"
                  ? "bg-orange-50 text-orange-600 border border-orange-200"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Proposals
            </Link>
            <div className="h-px bg-neutral-200 my-2"></div>
            <Link
              to="/categories"
              onClick={handleLinkClick}
              className={`block py-4 px-4 rounded-lg font-medium transition-colors text-lg ${
                location.pathname === "/categories"
                  ? "bg-orange-50 text-orange-600 border border-orange-200"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Categories
            </Link>
            <div className="h-px bg-neutral-200 mt-2"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileMenu;
