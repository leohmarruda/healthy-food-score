'use client';

/**
 * Utility functions for form field default values, placeholders, and tooltips
 */

export interface DefaultValueConfig {
  value: string | number | undefined;
  defaultValue?: number;
  showDefaultAsItalic?: boolean;
  placeholder?: string;
  isFocused?: boolean;
  dict?: any;
}

export interface DefaultValueResult {
  displayValue: string;
  placeholder: string | undefined;
  showIcon: boolean;
  showItalic: boolean;
  tooltipText: string;
}

/**
 * Determines if a value is empty or zero
 */
export function isEmptyOrZero(value: string | number | undefined): boolean {
  return value === undefined || value === null || value === '' || value === 0 || value === '0';
}

/**
 * Gets the "none" text from dictionary
 */
export function getNoneText(dict?: any): string {
  return dict?.hfsScores?.none || '(nenhum)';
}

/**
 * Gets the default value tooltip text from dictionary
 */
export function getDefaultTooltip(dict?: any): string {
  return dict?.components?.forms?.formField?.defaultValueTooltip || 'Dado não encontrado. Valor suposto.';
}

/**
 * Determines field display configuration for default values
 */
export function getDefaultValueConfig(config: DefaultValueConfig): DefaultValueResult {
  const {
    value,
    defaultValue,
    showDefaultAsItalic = false,
    placeholder,
    isFocused = false,
    dict
  } = config;

  const noneText = getNoneText(dict);
  const isEmpty = isEmptyOrZero(value);
  const isNonePlaceholder = placeholder === noneText || placeholder === '(nenhum)' || placeholder === '(none)';
  
  // Determine if we should show default icon (when field is empty, zero, or has "(nenhum)" placeholder)
  const showIcon = (isEmpty || isNonePlaceholder) && !isFocused;

  // Determine placeholder value
  let finalPlaceholder: string | undefined = undefined;
  if (showIcon && !isFocused) {
    if (showDefaultAsItalic && defaultValue !== undefined) {
      finalPlaceholder = String(defaultValue);
    } else if (isNonePlaceholder) {
      finalPlaceholder = placeholder;
    } else if (isEmpty) {
      finalPlaceholder = '0';
    }
  } else if (placeholder) {
    finalPlaceholder = placeholder;
  }

  // Determine display value
  const displayValue = (showIcon && finalPlaceholder) ? '' : String(value ?? '');

  // Determine if placeholder should be italic
  const showItalic = showIcon && finalPlaceholder !== undefined;

  return {
    displayValue,
    placeholder: finalPlaceholder,
    showIcon,
    showItalic,
    tooltipText: getDefaultTooltip(dict)
  };
}

/**
 * Renders the default value icon SVG
 */
export function DefaultValueIcon({ tooltipText }: { tooltipText: string }) {
  return (
    <svg
      className="w-3.5 h-3.5 text-text-main/50 ml-1 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      role="img"
      aria-label={tooltipText}
    >
      <title>{tooltipText}</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Gets CSS classes for placeholder styling
 */
export function getPlaceholderClasses(showItalic: boolean): string {
  return showItalic ? 'placeholder:italic placeholder:text-text-main/60' : '';
}

