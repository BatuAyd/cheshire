import { useState, useCallback } from 'react';

// Types
interface ValidationResult {
  valid: boolean;
  message: string;
}

interface ProposalFormData {
  title: string;
  description: string;
  voting_deadline: string;
  options: string[];
}

interface ValidationState {
  title: ValidationResult;
  description: ValidationResult;
  voting_deadline: ValidationResult;
  options: ValidationResult;
  overall: boolean;
}

// Custom hook for proposal validation
export const useProposalValidation = () => {
  const [validation, setValidation] = useState<ValidationState>({
    title: { valid: false, message: '' },
    description: { valid: false, message: '' },
    voting_deadline: { valid: false, message: '' },
    options: { valid: false, message: '' },
    overall: false
  });

  /**
   * Validate title
   */
  const validateTitle = useCallback((title: string): ValidationResult => {
    if (!title.trim()) {
      return { valid: false, message: 'Title is required' };
    }
    
    const trimmed = title.trim();
    if (trimmed.length < 10) {
      return { valid: false, message: 'Title must be at least 10 characters' };
    }
    
    if (trimmed.length > 100) {
      return { valid: false, message: 'Title must be less than 100 characters' };
    }
    
    return { valid: true, message: 'Title looks good!' };
  }, []);

  /**
   * Validate description
   */
  const validateDescription = useCallback((description: string): ValidationResult => {
    if (!description.trim()) {
      return { valid: false, message: 'Description is required' };
    }
    
    const trimmed = description.trim();
    if (trimmed.length < 50) {
      return { valid: false, message: 'Description must be at least 50 characters' };
    }
    
    if (trimmed.length > 1000) {
      return { valid: false, message: 'Description must be less than 1000 characters' };
    }
    
    return { valid: true, message: 'Description looks good!' };
  }, []);

  /**
   * Validate voting deadline
   */
  const validateDeadline = useCallback((deadline: string): ValidationResult => {
    if (!deadline) {
      return { valid: false, message: 'Voting deadline is required' };
    }
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (isNaN(deadlineDate.getTime())) {
      return { valid: false, message: 'Invalid date format' };
    }
    
    if (deadlineDate <= oneHourFromNow) {
      return { valid: false, message: 'Deadline must be at least 1 hour from now' };
    }
    
    // Check if deadline is reasonable (not too far in future - optional)
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (deadlineDate > oneYearFromNow) {
      return { valid: false, message: 'Deadline cannot be more than 1 year from now' };
    }
    
    return { valid: true, message: 'Deadline looks good!' };
  }, []);

  /**
   * Validate options array
   */
  const validateOptions = useCallback((options: string[]): ValidationResult => {
    // Filter valid options (non-empty, at least 3 chars)
    const validOptions = options.filter(option => 
      option && option.trim().length >= 3
    );
    
    if (validOptions.length < 2) {
      return { valid: false, message: 'At least 2 valid options are required' };
    }
    
    if (validOptions.length > 10) {
      return { valid: false, message: 'Maximum 10 options allowed' };
    }
    
    // Check for options that are too short but not empty
    const invalidOptions = options.filter(option => 
      option && option.trim().length > 0 && option.trim().length < 3
    );
    
    if (invalidOptions.length > 0) {
      return { valid: false, message: 'Each option must be at least 3 characters' };
    }
    
    // Check for options that are too long
    const tooLongOptions = options.filter(option => 
      option && option.trim().length > 200
    );
    
    if (tooLongOptions.length > 0) {
      return { valid: false, message: 'Each option must be less than 200 characters' };
    }
    
    // Check for duplicate options
    const uniqueOptions = [...new Set(validOptions.map(opt => opt.trim().toLowerCase()))];
    if (uniqueOptions.length !== validOptions.length) {
      return { valid: false, message: 'Options must be unique' };
    }
    
    return { valid: true, message: `${validOptions.length} valid options` };
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((formData: ProposalFormData) => {
    const titleValidation = validateTitle(formData.title);
    const descriptionValidation = validateDescription(formData.description);
    const deadlineValidation = validateDeadline(formData.voting_deadline);
    const optionsValidation = validateOptions(formData.options);
    
    const overall = titleValidation.valid && 
                   descriptionValidation.valid && 
                   deadlineValidation.valid && 
                   optionsValidation.valid;
    
    const newValidation = {
      title: titleValidation,
      description: descriptionValidation,
      voting_deadline: deadlineValidation,
      options: optionsValidation,
      overall
    };
    
    setValidation(newValidation);
    return newValidation;
  }, [validateTitle, validateDescription, validateDeadline, validateOptions]);

  /**
   * Validate single field and update state
   */
  const validateField = useCallback((field: keyof ProposalFormData, value: string | string[]) => {
    let fieldValidation: ValidationResult;
    
    switch (field) {
      case 'title':
        fieldValidation = validateTitle(value as string);
        break;
      case 'description':
        fieldValidation = validateDescription(value as string);
        break;
      case 'voting_deadline':
        fieldValidation = validateDeadline(value as string);
        break;
      case 'options':
        fieldValidation = validateOptions(value as string[]);
        break;
      default:
        return;
    }
    
    setValidation(prev => ({
      ...prev,
      [field]: fieldValidation,
      overall: prev.title.valid && prev.description.valid && prev.voting_deadline.valid && prev.options.valid
    }));
    
    return fieldValidation;
  }, [validateTitle, validateDescription, validateDeadline, validateOptions]);

  /**
   * Get minimum datetime for input (1 hour from now)
   */
  const getMinDatetime = useCallback(() => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    return oneHourFromNow.toISOString().slice(0, 16);
  }, []);

  /**
   * Get suggested datetime (24 hours from now)
   */
  const getSuggestedDatetime = useCallback(() => {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return twentyFourHoursFromNow.toISOString().slice(0, 16);
  }, []);

  return {
    validation,
    validateForm,
    validateField,
    getMinDatetime,
    getSuggestedDatetime,
    // Individual validators (if needed)
    validateTitle,
    validateDescription,
    validateDeadline,
    validateOptions
  };
};