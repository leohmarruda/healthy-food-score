import { getDefaultValueConfig, DefaultValueIcon, getPlaceholderClasses } from '@/utils/field-helpers';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  placeholder?: string;
  helperText?: string;
  className?: string;
  locked?: boolean;
  onToggleLock?: () => void;
  hasError?: boolean;
  dict?: any;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  onBlur,
  rows = 3,
  placeholder,
  helperText,
  className = '',
  locked = false,
  onToggleLock,
  hasError = false,
  dict
}: FormTextareaProps) {
  // Get default value configuration
  const defaultConfig = getDefaultValueConfig({
    value,
    placeholder,
    dict
  });
  
  return (
    <div>
      <label className="block text-sm font-medium text-text-main mb-1 flex items-center gap-1.5">
        <span>{label}</span>
        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
        <div className="ml-auto flex items-center gap-1.5">
          {hasError && (
            <svg
              className="w-4 h-4 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label={dict?.components?.forms?.formTextarea?.invalidJsonError || 'Invalid JSON'}
            >
              <title>{dict?.components?.forms?.formTextarea?.invalidJsonError || 'Invalid JSON'}</title>
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
                ? (dict?.components?.forms?.formTextarea?.unlockFieldTooltip || 'Unlock field (allow auto-update)')
                : (dict?.components?.forms?.formTextarea?.lockFieldTooltip || 'Lock field (prevent auto-update)')}
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
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={defaultConfig.placeholder}
        className={`w-full bg-background border ${
          hasError ? 'border-red-500/50' : 'border-text-main/20'
        } text-text-main p-3 rounded-theme text-sm ${getPlaceholderClasses(defaultConfig.showItalic)} ${className}`}
      />
      {helperText && (
        <p className="text-[10px] text-text-main/50 mt-1 uppercase">{helperText}</p>
      )}
    </div>
  );
}


