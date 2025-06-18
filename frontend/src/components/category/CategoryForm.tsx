import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../utils/api";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

interface Category {
  category_id: string;
  title: string;
  description: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  organizations: {
    organization_name: string;
  };
  users: {
    unique_id: string;
    first_name: string;
    last_name: string;
  };
  follower_count: number;
  is_following: boolean;
}

interface CategoryFormProps {
  onClose: () => void;
  onSuccess: (category: Category) => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Validation functions
  const validateTitle = (title: string) => {
    if (!title.trim()) return { valid: false, message: "Title is required" };
    const trimmed = title.trim();
    if (trimmed.length < 5)
      return { valid: false, message: "Title must be at least 5 characters" };
    if (trimmed.length > 30)
      return { valid: false, message: "Title must be less than 30 characters" };
    return { valid: true, message: "Title looks good!" };
  };

  const validateDescription = (description: string) => {
    if (!description.trim())
      return { valid: false, message: "Description is required" };
    const trimmed = description.trim();
    if (trimmed.length < 50)
      return {
        valid: false,
        message: "Description must be at least 50 characters",
      };
    if (trimmed.length > 1000)
      return {
        valid: false,
        message: "Description must be less than 1000 characters",
      };
    return { valid: true, message: "Description looks good!" };
  };

  // Memoized validation results
  const validation = useMemo(() => {
    const titleValidation = validateTitle(formData.title);
    const descriptionValidation = validateDescription(formData.description);

    return {
      title: titleValidation,
      description: descriptionValidation,
      overall: titleValidation.valid && descriptionValidation.valid,
    };
  }, [formData.title, formData.description]);

  // Show modal with animation
  useEffect(() => {
    setIsVisible(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.overall) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiFetch(`${API_BASE}/api/categories/create`, {
        method: "POST",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Category created:", data.category);
        onSuccess(data.category);
      } else {
        console.error("❌ Failed to create category:", data.error);
        // You could add error state here if needed
      }
    } catch (error) {
      console.error("Error:", error);
      // You could add error state here if needed
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Create New Category
          </h2>
          <p className="text-neutral-600">
            Create a category to share voting suggestions with your
            organization.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., AI Research, Campus Infrastructure"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                  validation.title.valid && formData.title
                    ? "border-green-300 bg-green-50"
                    : "border-neutral-300"
                }`}
                maxLength={30}
                required
              />
              {formData.title && (
                <p
                  className={`text-sm mt-1 ${
                    validation.title.valid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {validation.title.message}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                {formData.title.length}/30 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what types of proposals this category will provide suggestions for. Include your expertise and approach to decision-making..."
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-vertical ${
                  validation.description.valid && formData.description
                    ? "border-green-300 bg-green-50"
                    : "border-neutral-300"
                }`}
                maxLength={1000}
                required
              />
              {formData.description && (
                <p
                  className={`text-sm mt-1 ${
                    validation.description.valid
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {validation.description.message}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">
                    How Categories Work
                  </h4>
                  <p className="text-blue-700 text-sm">
                    As a category creator, you can provide voting suggestions on
                    proposals. People who follow your category will see these
                    suggestions when viewing proposals.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-6 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !validation.overall}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  submitting || !validation.overall
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md active:scale-95 cursor-pointer"
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Creating Category...
                  </div>
                ) : (
                  "Create Category"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
