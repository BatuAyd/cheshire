import { useState, useEffect, useMemo } from "react";

interface ProposalFormProps {
  onSuccess: (proposal: any) => void;
  onError: (error: string) => void;
}

const ProposalForm = ({ onSuccess, onError }: ProposalFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    voting_deadline: "",
    options: ["", ""], // Start with 2 empty options
  });

  const [submitting, setSubmitting] = useState(false);
  const [organizationInfo, setOrganizationInfo] = useState<{
    organization_name: string;
    can_create: boolean;
  } | null>(null);

  // Get minimum datetime for input (1 hour from now)
  const getMinDatetime = () => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return oneHourFromNow.toISOString().slice(0, 16);
  };

  // Get suggested datetime (24 hours from now)
  const getSuggestedDatetime = () => {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return twentyFourHoursFromNow.toISOString().slice(0, 16);
  };

  // Option character limits
  const OPTION_MIN_CHARS = 3;
  const OPTION_MAX_CHARS = 200;

  // Validation functions
  const validateTitle = (title: string) => {
    if (!title.trim()) return { valid: false, message: "Title is required" };
    const trimmed = title.trim();
    if (trimmed.length < 10)
      return { valid: false, message: "Title must be at least 10 characters" };
    if (trimmed.length > 100)
      return {
        valid: false,
        message: "Title must be less than 100 characters",
      };
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

  const validateDeadline = (deadline: string) => {
    if (!deadline)
      return { valid: false, message: "Voting deadline is required" };
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (isNaN(deadlineDate.getTime()))
      return { valid: false, message: "Invalid date format" };
    if (deadlineDate <= oneHourFromNow)
      return {
        valid: false,
        message: "Deadline must be at least 1 hour from now",
      };

    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (deadlineDate > oneYearFromNow)
      return {
        valid: false,
        message: "Deadline cannot be more than 1 year from now",
      };

    return { valid: true, message: "Deadline looks good!" };
  };

  const validateOptions = (options: string[]) => {
    const validOptions = options.filter(
      (option) => option && option.trim().length >= OPTION_MIN_CHARS
    );

    if (validOptions.length < 2)
      return { valid: false, message: "At least 2 valid options are required" };
    if (validOptions.length > 10)
      return { valid: false, message: "Maximum 10 options allowed" };

    const invalidOptions = options.filter(
      (option) =>
        option &&
        option.trim().length > 0 &&
        option.trim().length < OPTION_MIN_CHARS
    );
    if (invalidOptions.length > 0)
      return {
        valid: false,
        message: `Each option must be at least ${OPTION_MIN_CHARS} characters`,
      };

    const tooLongOptions = options.filter(
      (option) => option && option.trim().length > OPTION_MAX_CHARS
    );
    if (tooLongOptions.length > 0)
      return {
        valid: false,
        message: `Each option must be less than ${OPTION_MAX_CHARS} characters`,
      };

    const uniqueOptions = [
      ...new Set(validOptions.map((opt) => opt.trim().toLowerCase())),
    ];
    if (uniqueOptions.length !== validOptions.length)
      return { valid: false, message: "Options must be unique" };

    return { valid: true, message: `${validOptions.length} valid options` };
  };

  // Memoized validation results
  const validation = useMemo(() => {
    const titleValidation = validateTitle(formData.title);
    const descriptionValidation = validateDescription(formData.description);
    const deadlineValidation = validateDeadline(formData.voting_deadline);
    const optionsValidation = validateOptions(formData.options);

    return {
      title: titleValidation,
      description: descriptionValidation,
      voting_deadline: deadlineValidation,
      options: optionsValidation,
      overall:
        titleValidation.valid &&
        descriptionValidation.valid &&
        deadlineValidation.valid &&
        optionsValidation.valid,
    };
  }, [
    formData.title,
    formData.description,
    formData.voting_deadline,
    formData.options,
  ]);

  // Load organization info and set default deadline
  useEffect(() => {
    const loadInfo = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/proposals/can-create",
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (response.ok) {
          setOrganizationInfo({
            organization_name: data.organization_name || "Your Organization",
            can_create: data.can_create,
          });

          if (!data.can_create) {
            onError("You must be part of an organization to create proposals");
          }
        }
      } catch (error) {
        console.error("Error loading organization info:", error);
        onError("Failed to load organization information");
      }
    };

    loadInfo();

    // Set default deadline to 24 hours from now
    setFormData((prev) => ({
      ...prev,
      voting_deadline: getSuggestedDatetime(),
    }));
  }, [onError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        options: newOptions,
      }));
    }
  };

  const getOptionPlaceholder = (index: number): string => {
    if (index === 0 && !formData.options[0]) return "Approve";
    if (index === 1 && !formData.options[1]) return "Reject";
    return `Option ${index + 1}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.overall) {
      onError("Please fix form errors before submitting");
      return;
    }

    if (!organizationInfo?.can_create) {
      onError("You cannot create proposals");
      return;
    }

    try {
      setSubmitting(true);

      // Filter out empty options
      const cleanOptions = formData.options.filter(
        (option) => option.trim().length >= OPTION_MIN_CHARS
      );

      const response = await fetch(
        "http://localhost:8080/api/proposals/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            voting_deadline: formData.voting_deadline,
            options: cleanOptions,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Proposal created:", data.proposal);
        onSuccess(data.proposal);
      } else {
        onError(data.error || "Failed to create proposal");
      }
    } catch (error) {
      console.error("Error:", error);
      onError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Don't render if user can't create proposals
  if (organizationInfo && !organizationInfo.can_create) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">
          Create New Proposal
        </h1>
        <p className="text-neutral-600">
          Create a new proposal for voting in{" "}
          <span className="font-medium text-orange-500">
            {organizationInfo?.organization_name || "your organization"}
          </span>
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Enhanced datetime-local styles */}
        <style>{`
          /* Improve datetime-local appearance */
          input[type="datetime-local"] {
            position: relative;
            font-family: inherit;
          }
          
          /* Style the date/time segments */
          input[type="datetime-local"]::-webkit-datetime-edit {
            padding: 0;
          }
          
          input[type="datetime-local"]::-webkit-datetime-edit-fields-wrapper {
            padding: 0;
          }
          
          input[type="datetime-local"]::-webkit-datetime-edit-text {
            padding: 2px 4px;
            color: #6b7280;
          }
          
          input[type="datetime-local"]::-webkit-datetime-edit-month-field,
          input[type="datetime-local"]::-webkit-datetime-edit-day-field,
          input[type="datetime-local"]::-webkit-datetime-edit-year-field,
          input[type="datetime-local"]::-webkit-datetime-edit-hour-field,
          input[type="datetime-local"]::-webkit-datetime-edit-minute-field,
          input[type="datetime-local"]::-webkit-datetime-edit-ampm-field {
            padding: 2px 4px;
            border-radius: 3px;
            color: #374151;
            font-weight: 500;
          }
          
          input[type="datetime-local"]::-webkit-datetime-edit-month-field:focus,
          input[type="datetime-local"]::-webkit-datetime-edit-day-field:focus,
          input[type="datetime-local"]::-webkit-datetime-edit-year-field:focus,
          input[type="datetime-local"]::-webkit-datetime-edit-hour-field:focus,
          input[type="datetime-local"]::-webkit-datetime-edit-minute-field:focus,
          input[type="datetime-local"]::-webkit-datetime-edit-ampm-field:focus {
            background-color: #fb923c;
            color: white;
            outline: none;
          }
          
          /* Calendar picker button */
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            background: transparent;
            bottom: 0;
            color: transparent;
            cursor: pointer;
            height: auto;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: auto;
            padding: 6px;
            border-radius: 4px;
          }
          
          input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
            background-color: rgba(251, 146, 60, 0.1);
          }
        `}</style>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proposal Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Improve campus WiFi infrastructure"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                validation.title.valid && formData.title
                  ? "border-green-300 bg-green-50"
                  : "border-neutral-300"
              }`}
              maxLength={100}
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
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Provide a detailed description of the proposal, including the problem it solves and expected benefits..."
              rows={4}
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

          {/* Voting Deadline - Enhanced HTML5 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Voting Deadline *
            </label>

            <div className="relative">
              <input
                type="datetime-local"
                value={formData.voting_deadline}
                onChange={(e) =>
                  handleInputChange("voting_deadline", e.target.value)
                }
                min={getMinDatetime()}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base ${
                  validation.voting_deadline.valid && formData.voting_deadline
                    ? "border-green-300 bg-green-50"
                    : "border-neutral-300"
                }`}
                style={{
                  colorScheme: "light",
                  fontSize: "16px", // Prevents zoom on iOS
                }}
                required
              />

              {/* Helper icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Display formatted date */}
            {formData.voting_deadline && (
              <p className="text-sm text-neutral-600 mt-1">
                📅 {formatDateForDisplay(formData.voting_deadline)}
              </p>
            )}

            {formData.voting_deadline && (
              <p
                className={`text-sm mt-1 ${
                  validation.voting_deadline.valid
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {validation.voting_deadline.message}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-1">
              Minimum 1 hour from now • Click date/time parts to edit • Use
              arrows to adjust
            </p>
          </div>

          {/* Voting Options - Fixed Alignment */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Voting Options * (
              {
                formData.options.filter(
                  (opt) => opt.trim().length >= OPTION_MIN_CHARS
                ).length
              }
              /10)
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-sm text-neutral-500 w-8 pt-3">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={getOptionPlaceholder(index)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      maxLength={OPTION_MAX_CHARS}
                    />
                    {option && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {option.length}/{OPTION_MAX_CHARS} characters (min{" "}
                        {OPTION_MIN_CHARS})
                      </p>
                    )}
                  </div>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 mt-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove option"
                    >
                      <svg
                        className="w-5 h-5"
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
                  )}
                </div>
              ))}
            </div>

            {/* Fixed alignment for Add Option button */}
            {formData.options.length < 10 && (
              <div className="flex gap-3 mt-3">
                <div className="w-8"></div> {/* Spacer to align with inputs */}
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 text-orange-500 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Option
                </button>
              </div>
            )}

            {validation.options.message && (
              <p
                className={`text-sm mt-2 ${
                  validation.options.valid ? "text-green-600" : "text-red-600"
                }`}
              >
                {validation.options.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !validation.overall}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
              submitting || !validation.overall
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                : "bg-orange-400 text-white hover:bg-orange-500 hover:shadow-md active:scale-95"
            }`}
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Creating Proposal...
              </div>
            ) : (
              "Create Proposal"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProposalForm;
