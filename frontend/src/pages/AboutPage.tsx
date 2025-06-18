const AboutPage = () => {
  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Hero Section */}
      <section className="text-center mb-32">
        <h1 className="text-5xl md:text-7xl font-light text-neutral-800 mb-8 tracking-tight">
          Democracy that <br />
          <span className="font-medium text-orange-400">flows</span>
        </h1>
        <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-light">
          Vote directly or delegate.
          <br />
          However you like.
        </p>
      </section>

      {/* Core Concept */}
      <section className="mb-32 border-t border-neutral-200 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left: Simple explanation */}
          <div className="space-y-10">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-neutral-800 rounded-full mt-3"></div>
              <div>
                <h3 className="text-2xl font-light text-neutral-800 mb-2">
                  Vote directly
                </h3>
                <p className="text-neutral-500 border-l border-neutral-200 pl-4">
                  On topics you understand or care deeply about
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-neutral-400 rounded-full mt-3"></div>
              <div>
                <h3 className="text-2xl font-light text-neutral-800 mb-2">
                  Delegate to experts
                </h3>
                <p className="text-neutral-500 border-l border-neutral-200 pl-4">
                  Let knowledgeable people handle complex decisions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-orange-400 rounded-full mt-3"></div>
              <div>
                <h3 className="text-2xl font-light text-neutral-800 mb-2">
                  Change anytime
                </h3>
                <p className="text-neutral-500 border-l border-neutral-200 pl-4">
                  Override any delegation with your direct vote
                </p>
              </div>
            </div>
          </div>

          {/* Right: Delegation Chain */}
          <div className="bg-neutral-50 rounded-lg p-12 relative">
            <h4 className="text-lg font-medium text-neutral-700 mb-12 text-center">
              How delegation chains work
            </h4>

            {/* Linear Chain Structure */}
            <div className="relative flex flex-col items-center space-y-8">
              {/* You */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-2 border-neutral-300 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-600">
                    You
                  </span>
                </div>
                <span className="text-xs text-neutral-500 mt-2">
                  delegate to
                </span>
                <div className="w-px h-6 bg-neutral-300 mt-2"></div>
              </div>

              {/* Alice - Tech Expert */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-2 border-neutral-400 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-600">
                    Alice
                  </span>
                </div>
                <span className="text-xs text-neutral-500 mt-1">
                  Tech Expert
                </span>
                <span className="text-xs text-neutral-400 mt-1">
                  delegates to
                </span>
                <div className="w-px h-6 bg-neutral-300 mt-2"></div>
              </div>

              {/* Bob - Specialist */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-2 border-neutral-500 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-600">
                    Bob
                  </span>
                </div>
                <span className="text-xs text-neutral-500 mt-1">
                  AI Specialist
                </span>
                <span className="text-xs text-neutral-400 mt-1">
                  delegates to
                </span>
                <div className="w-px h-6 bg-neutral-300 mt-2"></div>
              </div>

              {/* Carol - Researcher */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-2 border-orange-300 rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs font-medium text-neutral-600">
                    Carol
                  </span>
                </div>
                <span className="text-xs text-neutral-500 mt-1">
                  ML Researcher
                </span>
                <span className="text-xs text-neutral-400 mt-1">
                  votes directly
                </span>
                <div className="w-px h-6 bg-neutral-300 mt-2"></div>
              </div>

              {/* Final Vote */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-xs text-neutral-500 mt-2">
                  Your vote carries knowledge
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits - Minimal Cards */}
      <section className="mb-32 border-t border-neutral-200 pt-16">
        <h2 className="text-3xl font-light text-neutral-800 text-center mb-16">
          Why it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="h-1 w-12 bg-neutral-800 mx-auto"></div>
            <h3 className="text-xl font-light text-neutral-800">Expertise</h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Complex decisions flow to those with relevant knowledge
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-1 w-12 bg-neutral-400 mx-auto"></div>
            <h3 className="text-xl font-light text-neutral-800">Efficiency</h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Focus your time on issues that matter most to you
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-1 w-12 bg-orange-400 mx-auto"></div>
            <h3 className="text-xl font-light text-neutral-800">Flexibility</h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Your approach can evolve with every decision
            </p>
          </div>
        </div>
      </section>

      {/* Categories - Clean Layout */}
      <section className="mb-32 border-t border-neutral-200 pt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-neutral-800 mb-12">
            Categories organize expertise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-6 h-6 border border-neutral-300 rounded-sm bg-white mx-auto"></div>
              <h3 className="font-medium text-neutral-800">Create</h3>
              <p className="text-neutral-500 text-sm">
                Anyone can create specialized categories
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-6 h-6 border border-neutral-300 rounded-sm bg-neutral-100 mx-auto"></div>
              <h3 className="font-medium text-neutral-800">Follow</h3>
              <p className="text-neutral-500 text-sm">
                Subscribe to categories from trusted experts
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-6 h-6 border border-orange-400 rounded-sm bg-orange-50 mx-auto"></div>
              <h3 className="font-medium text-neutral-800">Guide</h3>
              <p className="text-neutral-500 text-sm">
                See expert recommendations when voting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History - Minimal */}
      <section className="mb-32">
        <div className="border-t border-neutral-200 pt-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-2xl font-light text-neutral-800">Origins</h2>
            <p className="text-neutral-500 leading-relaxed">
              Proxy voting traces back to ancient Rome's collegia and Greek
              city-states, where citizens could delegate voting tokens. Medieval
              guilds later formalized this, letting craftsmen delegate votes to
              guild masters who understood complex regulations.
            </p>
            <p className="text-neutral-500 leading-relaxed">
              Through the 18th and 19th centuries, theorists like Condorcet and
              Victor D'Hondt explored delegation and proportional systems.
              Mathematician Charles Dodgson —Lewis Carroll of Alice in
              Wonderland fame- contributed to this tradition with his 1880s work
              on alternative voting methods. The modern term "liquid democracy"
              emerged in the early 2000s, with "liquid" describing how voting
              power flows through networks.
            </p>
            <p className="text-sm text-neutral-400">
              We're called Cheshire as a nod to Carroll's mathematical
              contributions—and perhaps, where 'everybody has won, and all must
              have prizes,' captures the complexity of democratic decision
              making.
            </p>
            <div className="pt-8 border-t border-neutral-100 space-y-4">
              <p className="text-sm text-neutral-500">
                Estonia pioneered digital voting for national elections since
                2005, with over 40% participation online.
              </p>
              <p className="text-sm text-neutral-500">
                Germany's Pirate Party used liquid democracy for internal
                decisions from 2006-2017.
              </p>
              <p className="text-sm text-neutral-500">
                Podemos in Spain adopted liquid voting for party policy
                formation in 2014.
              </p>
              <p className="text-sm text-neutral-500">
                Google and other tech companies use variations of liquid voting
                for internal governance.
              </p>
              <p className="text-xs text-neutral-400 pt-4">
                Modern digital platforms finally make the theoretical concept
                practically viable at scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emphasis on Choice */}
      <section className="mb-16 border-t border-neutral-200 pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-4">
              <div className="w-12 h-px bg-neutral-800 mx-auto"></div>
              <h3 className="text-xl font-light text-neutral-800">
                When you want control
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Vote directly on issues that affect you personally, topics you
                understand well, or decisions where you have strong convictions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-px bg-orange-400 mx-auto"></div>
              <h3 className="text-xl font-light text-neutral-800">
                When you trust expertise
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Delegate complex technical decisions, unfamiliar topics, or
                areas where others have deeper knowledge and experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="text-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-light text-neutral-800">
            Your choice, every time
          </h2>
          <p className="text-neutral-500">
            Connect your wallet to start participating
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
