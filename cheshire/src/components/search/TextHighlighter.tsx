import React from "react";

interface TextHighlighterProps {
  text: string;
  searchQuery: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Component that highlights search terms within text
 * Supports multiple search terms and case-insensitive matching
 */
const TextHighlighter: React.FC<TextHighlighterProps> = ({
  text,
  searchQuery,
  className = "",
  highlightClassName = "bg-yellow-200 font-medium text-neutral-900 px-0.5 rounded",
}) => {
  // If no search query, return original text
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  const query = searchQuery.toLowerCase().trim();
  const searchTerms = query.split(/\s+/).filter((term) => term.length > 0);

  // If no valid search terms, return original text
  if (searchTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create regex pattern that matches any of the search terms
  // Escape special regex characters and join with OR operator
  const escapedTerms = searchTerms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escapedTerms.join("|")})`, "gi");

  // Split text by the pattern and highlight matches
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches any search term (case-insensitive)
        const isMatch = searchTerms.some(
          (term) => part.toLowerCase() === term.toLowerCase()
        );

        if (isMatch) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }

        return part;
      })}
    </span>
  );
};

export default TextHighlighter;
