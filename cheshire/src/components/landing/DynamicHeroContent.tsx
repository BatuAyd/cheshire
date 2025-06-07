import React, { useState, useEffect } from "react";

const DynamicHeroContent: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Words to cycle through
  const words = ["flows", "connects", "amplifies", "sculpts", "cultivates"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsVisible(true);
      }, 600); // Match the transition duration
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-5xl md:text-7xl font-light text-neutral-800/80 mb-8 tracking-tight text-center">
        <span className="block">Democracy that</span>
        <span
          className={`inline-block font-medium text-orange-400/80 transition-all duration-[600ms] ease-in-out min-w-[200px] md:min-w-[280px] ${
            isVisible
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform translate-y-2"
          }`}
        >
          {words[currentWordIndex]}
        </span>
      </h1>
    </div>
  );
};

export default DynamicHeroContent;
