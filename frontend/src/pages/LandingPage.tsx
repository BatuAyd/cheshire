import { InteractiveCanvas, DynamicHeroContent } from "../components/landing";

const LandingPage = () => {
  const handleGetStarted = () => {
    // Always scroll to how-to-start section for all users
    const element = document.getElementById("how-to-start");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative">
      {/* Interactive Canvas Background - Phase 1 */}
      <InteractiveCanvas />

      {/* Content Layer */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Hero section */}
        <section className="py-12 md:py-20">
          <div className="text-center">
            <DynamicHeroContent />
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-light mb-8">
              Vote directly or delegate.
              <br />
              However you like.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium text-lg shadow-md hover:bg-orange-600 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Features section */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Vote Directly"
              description="Cast your vote directly on proposals that matter to you. Your voice, your choice, every time."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />

            <FeatureCard
              title="Delegate to Experts"
              description="Don't have time for every decision? Delegate your voting power to trusted representatives who share your values."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />

            <FeatureCard
              title="Follow Categories"
              description="Follow category experts and get guidance on complex topics. Learn from specialists and make informed decisions."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              }
            />
          </div>
        </section>

        {/* How to start section */}
        <section
          id="how-to-start"
          className="py-12 bg-orange-50 rounded-xl p-8 mb-12"
        >
          <h2 className="text-3xl font-bold mb-6 text-neutral-800">
            How to Get Started
          </h2>
          <div className="space-y-6">
            <Step
              number={1}
              title="Connect Your Wallet"
              description="Click the 'Connect' button in the top-right corner to connect your Ethereum wallet."
            />
            <Step
              number={2}
              title="Sign In & Complete Setup"
              description="Sign a message to verify ownership of your wallet, then complete your user profile setup."
            />
            <Step
              number={3}
              title="Start Participating"
              description="Browse active proposals, browser categories, cast your votes, or delegate your voting power."
            />
          </div>
        </section>
      </div>
    </div>
  );
};

// Feature card component
const FeatureCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-orange-200 border border-transparent group ">
      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-orange-200">
        <div className="text-orange-500 transition-colors duration-300 group-hover:text-orange-600">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-medium text-neutral-800 mb-2 transition-colors duration-300 group-hover:text-neutral-900">
        {title}
      </h3>
      <p className="text-neutral-600 transition-colors duration-300 group-hover:text-neutral-700">
        {description}
      </p>
    </div>
  );
};

// Step component
const Step = ({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) => {
  return (
    <div className="flex group transition-all duration-300 hover:translate-x-1">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold transition-all duration-300 group-hover:bg-orange-500 group-hover:scale-105">
        {number}
      </div>
      <div className="ml-4">
        <h3 className="text-xl font-medium text-neutral-800 transition-colors duration-300 group-hover:text-neutral-900">
          {title}
        </h3>
        <p className="text-neutral-600 transition-colors duration-300 group-hover:text-neutral-700">
          {description}
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
