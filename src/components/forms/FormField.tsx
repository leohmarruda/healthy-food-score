import type { FoodFormData } from '@/types/food';
import { getDefaultValueConfig, DefaultValueIcon, getPlaceholderClasses } from '@/utils/field-helpers';

interface FormFieldProps {
  label: string;
  name: keyof FoodFormData;
  value: string | number | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'number';
  step?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  locked?: boolean;
  onToggleLock?: () => void;
  hasError?: boolean;
  dict?: any;
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = 'text',
  step = '0.1',
  placeholder,
  className = '',
  required = false,
  locked = false,
  onToggleLock,
  hasError = false,
  dict
}: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // For number inputs, prevent negative values
    if (type === 'number') {
      // Allow empty string, single minus (being typed), or non-negative numbers
      if (inputValue === '' || inputValue === '-') {
        onChange(inputValue);
      } else {
        const numValue = parseFloat(inputValue);
        // Only update if the value is valid and non-negative
        if (!isNaN(numValue) && numValue >= 0) {
          onChange(inputValue);
        }
        // If negative, ignore the change
      }
    } else {
      onChange(inputValue);
    }
  };

  // Get default value configuration
  const defaultConfig = getDefaultValueConfig({
    value,
    placeholder,
    dict
  });

  return (
    <div>
      <label className="block text-xs font-bold text-text-main/70 mb-1 flex items-center gap-1.5">
        <span>{label.replace(/\*$/, '')}</span>
        {required && <span className="text-red-600 font-black text-sm ml-0.5">*</span>}
        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
        <div className="ml-auto flex items-center gap-1.5">
          {hasError && (
            <svg
              className="w-4 h-4 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label={dict?.components?.forms?.formField?.invalidNumberError || 'Invalid number'}
            >
              <title>{dict?.components?.forms?.formField?.invalidNumberError || 'Invalid number'}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
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
        type={type}
        step={type === 'number' ? step : undefined}
        min={type === 'number' ? '0' : undefined}
        value={value ?? ''}
        placeholder={defaultConfig.placeholder}
        onChange={handleChange}
        onBlur={onBlur}
        required={required}
        className={`w-full bg-background border ${
          hasError ? 'border-red-500/50' : 'border-text-main/20'
        } text-text-main p-2 rounded-theme ${getPlaceholderClasses(defaultConfig.showItalic)} ${className}`}
      />
    </div>
  );
}

