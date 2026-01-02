'use client';
import { useState, useEffect } from 'react';
import type { FoodFormData } from '@/types/food';
import { getDefaultValueConfig, DefaultValueIcon, getPlaceholderClasses } from '@/utils/field-helpers';

interface NumericFieldProps {
  label: string;
  name: keyof FoodFormData;
  value: string | number | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  step?: string;
  className?: string;
  required?: boolean;
  locked?: boolean;
  onToggleLock?: () => void;
  onFieldError?: (fieldName: string, hasError: boolean) => void;
  dict?: any;
  integerOnly?: boolean;
  defaultValue?: number;
  showDefaultAsItalic?: boolean;
  max?: number;
}

// Helper function to validate numeric fields
const isValidNumber = (value: string | number | undefined, allowEmpty: boolean = true, integerOnly: boolean = false, max?: number): boolean => {
  if (value === undefined || value === null || value === '') {
    return allowEmpty;
  }
  const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (isNaN(numValue) || !isFinite(numValue) || numValue < 0) {
    return false;
  }
  if (max !== undefined && numValue > max) {
    return false;
  }
  if (integerOnly && numValue % 1 !== 0) {
    return false;
  }
  return true;
};

// Convert comma to dot and normalize value
const normalizeValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const strValue = String(value);
  return strValue.replace(',', '.');
};

export default function NumericField({
  label,
  name,
  value,
  onChange,
  onBlur,
  step = '0.1',
  className = '',
  required = false,
  locked = false,
  onToggleLock,
  onFieldError,
  dict,
  integerOnly = false,
  defaultValue,
  showDefaultAsItalic = false,
  max
}: NumericFieldProps) {
  const [hasError, setHasError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(normalizeValue(value));

  // Report error state to parent
  useEffect(() => {
    if (onFieldError) {
      onFieldError(name as string, hasError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasError, name]);

  // Update display value when prop value changes (but not while focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(normalizeValue(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string
    if (inputValue === '') {
      setDisplayValue('');
      onChange('');
      setHasError(false);
      return;
    }

    // Validate format: digits, optional point/comma, optional digits
    // Regex: ^\d+([.,]\d*)?$ or ^\d*[.,]\d+$ (allows .5 or ,5)
    const validFormatRegex = /^\d*[.,]?\d*$/;
    
    if (!validFormatRegex.test(inputValue)) {
      // Invalid format - don't update
      return;
    }

    // Check for multiple decimal separators
    const commaCount = (inputValue.match(/,/g) || []).length;
    const dotCount = (inputValue.match(/\./g) || []).length;
    
    if (commaCount > 1 || dotCount > 1 || (commaCount > 0 && dotCount > 0)) {
      // Multiple separators or mixed separators - don't update
      return;
    }

    // Allow single comma or dot while typing
    if (inputValue === ',' || inputValue === '.') {
      setDisplayValue(inputValue);
      onChange(inputValue);
      setHasError(false);
      return;
    }

    // Replace comma with dot for internal processing
    const normalizedInput = inputValue.replace(',', '.');
    
    // Check if it's a valid number (positive only)
    const numValue = parseFloat(normalizedInput);
    
    // Allow incomplete numbers like "12." or "12," while typing
    if (inputValue.endsWith('.') || inputValue.endsWith(',')) {
      setDisplayValue(inputValue);
      onChange(normalizedInput);
      setHasError(false);
      return;
    }
    
    if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
      // Check max value if specified
      if (max !== undefined && numValue > max) {
        setHasError(true);
        setDisplayValue(inputValue);
        onChange(normalizedInput);
        return;
      }
      // If integer only, check if it's an integer
      if (integerOnly && numValue % 1 !== 0) {
        setHasError(true);
      } else {
        setHasError(false);
      }
      setDisplayValue(inputValue); // Keep original input (with comma if user typed it)
      onChange(normalizedInput); // Send normalized value (with dot) to parent
    } else if (normalizedInput === '-' || normalizedInput.startsWith('-')) {
      // Don't allow negative values
      setHasError(true);
      setDisplayValue(inputValue);
      onChange(normalizedInput);
    } else {
      // Invalid value
      setHasError(true);
      setDisplayValue(inputValue);
      onChange(normalizedInput);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Convert comma to dot on blur and update parent
    const normalized = normalizeValue(displayValue);
    const numValue = normalized ? parseFloat(normalized) : undefined;
    
    // Convert comma to dot and update display
    setDisplayValue(normalized);
    if (normalized !== displayValue) {
      onChange(normalized);
    }
    
    // Validate using the normalized value
    const currentValue = normalized || value;
    const isValid = isValidNumber(currentValue, true, integerOnly, max);
    setHasError(!isValid && currentValue !== '' && currentValue !== undefined && currentValue !== null);
    
    // Call parent onBlur if provided
    if (onBlur) {
      onBlur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHasError(false);
    // Clear display value when focusing if it's empty or default
    if (value === undefined || value === null || value === '' || displayValue === '' || (showDefaultAsItalic && defaultValue !== undefined)) {
      setDisplayValue('');
    }
  };

  // Get default value configuration
  const defaultConfig = getDefaultValueConfig({
    value,
    defaultValue,
    showDefaultAsItalic,
    isFocused,
    dict
  });
  
  const finalValue = defaultConfig.displayValue;
  const placeholderValue = defaultConfig.placeholder;

  return (
    <div id={`field-${name as string}`} data-field-container={name as string}>
      <label className="block text-xs font-bold text-text-main/70 mb-1 flex items-center gap-1.5">
        <span>{label.replace(/\*$/, '')}</span>
        {required && <span className="text-red-600 font-black text-sm ml-0.5">*</span>}
        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
        <div className="ml-auto flex items-center gap-1.5">
          {hasError && (() => {
            // Build error message with expected value information
            const t = dict?.components?.forms?.formField || {};
            let errorMessage = t.invalidNumberError || 'Invalid number';
            const expectedParts: string[] = [];
            
            if (integerOnly) {
              expectedParts.push(t.integer || 'integer');
            }
            
            if (max !== undefined) {
              expectedParts.push(`${t.maximum || 'maximum'} ${max}`);
            }
            
            expectedParts.push(t.positive || 'positive');
            
            if (expectedParts.length > 0) {
              const expectedText = expectedParts.join(', ');
              errorMessage = `${errorMessage}. ${t.expectedValue || 'Expected value'}: ${expectedText}`;
            }
            
            return (
              <svg
                className="w-4 h-4 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label={errorMessage}
              >
                <title>{errorMessage}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            );
          })()}
          {onToggleLock && (
            <button
              type="button"
              onClick={onToggleLock}
              className="flex-shrink-0"
              title={locked 
                ? (dict?.components?.forms?.formField?.unlockFieldTooltip || 'Unlock field (allow auto-update)')
                : (dict?.components?.forms?.formField?.lockFieldTooltip || 'Lock field (prevent auto-update)')}
            >
              <svg
                className={`w-3.5 h-3.5 transition-colors ${
                  locked ? 'text-primary' : 'text-text-main/30 hover:text-text-main/50'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {locked ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                )}
              </svg>
            </button>
          )}
        </div>
      </label>
      <input
        type="text"
        inputMode="decimal"
        name={name as string}
        data-field-name={name as string}
        step={integerOnly ? '1' : step}
        value={finalValue}
        placeholder={placeholderValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        disabled={locked}
        className={`w-full bg-background border ${
          hasError ? 'border-red-500/50' : 'border-text-main/20'
        } text-text-main p-2 rounded-theme ${getPlaceholderClasses(defaultConfig.showItalic)} ${className} ${
          locked ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

