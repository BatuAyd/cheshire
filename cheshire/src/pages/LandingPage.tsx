import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/voting");
    } else {
      // If not authenticated, scroll to explain how to connect
      const element = document.getElementById("how-to-start");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero section */}
      <section className="py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-800">
            Liquid Voting <span className="text-orange-500">Made Simple</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            A decentralized platform that enables more democratic
            decision-making through delegated voting power.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium text-lg shadow-md hover:bg-orange-600 transition-all"
          >
            {isAuthenticated ? "Go to Voting" : "Get Started"}
          </button>
        </div>
      </section>

      {/* Features section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-neutral-800">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="Delegate Voting Power"
            description="Don't have time to vote on every proposal? Delegate your voting power to trusted representatives."
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
            title="Real-Time Results"
            description="See voting results update in real-time as votes are cast and delegated across the network."
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />

          <FeatureCard
            title="Fully On-Chain"
            description="All votes are recorded on the blockchain, ensuring transparency and immutability."
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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
            title="Sign In With Ethereum"
            description="Sign a message to verify ownership of your wallet and create a secure session."
          />
          <Step
            number={3}
            title="Start Participating"
            description="Browse active proposals, cast your votes, or delegate your voting power to trusted representatives."
          />
        </div>
      </section>
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
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center mb-4">
        <div className="text-orange-500">{icon}</div>
      </div>
      <h3 className="text-lg font-medium text-neutral-800 mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
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
    <div className="flex">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="ml-4">
        <h3 className="text-xl font-medium text-neutral-800">{title}</h3>
        <p className="text-neutral-600">{description}</p>
      </div>
    </div>
  );
};

export default LandingPage;
