import React from "react";
import { useNavigate } from "react-router-dom";
import CatIllustration from "../assets/images/cat.png";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-orange-500 transition-colors mb-8"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Go back
        </button>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
          {/* Content section */}
          <div className="order-2 lg:order-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-1 w-8 bg-orange-500"></div>
                <span className="text-sm font-medium text-neutral-500 tracking-wide">
                  404 ERROR
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-light text-neutral-900 leading-tight">
                Page not found
              </h1>

              <p className="text-lg text-neutral-600 leading-relaxed max-w-md">
                The page you're looking for doesn't exist or has been moved. Our
                cat is just as confused as you are.
              </p>
            </div>

            {/* Primary actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleGoHome}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors hover:shadow-md active:scale-95 cursor-pointer"
              >
                Take me home
              </button>

              <button
                onClick={handleGoBack}
                className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 hover:border-neutral-400 transition-colors cursor-pointer"
              >
                Go back
              </button>
            </div>

            {/* Navigation suggestions */}
            <div className="pt-8 border-t border-neutral-200">
              <p className="text-sm text-neutral-500 mb-3">
                Or try one of these:
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <button
                  onClick={() => handleNavigation("/proposals")}
                  className="text-neutral-600 hover:text-orange-500 transition-colors"
                >
                  Browse proposals
                </button>
                <button
                  onClick={() => handleNavigation("/categories")}
                  className="text-neutral-600 hover:text-orange-500 transition-colors"
                >
                  Explore categories
                </button>
                <button
                  onClick={() => handleNavigation("/about")}
                  className="text-neutral-600 hover:text-orange-500 transition-colors"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>

          {/* Cat illustration */}
          <div className="order-1 lg:order-1 flex justify-center lg:justify-start">
            <div className="w-48 h-64 lg:w-56 lg:h-72 opacity-80 hover:opacity-100 transition-opacity duration-300">
              <img
                src={CatIllustration}
                alt="Lost cat illustration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Decorative footer element */}
        <div className="mt-16 pt-8 border-t border-neutral-100">
          <div className="flex items-center justify-center gap-2 text-neutral-400"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
