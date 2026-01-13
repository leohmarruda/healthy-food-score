'use client';
import FormField from './FormField';
import NumericField from './NumericField';
import type { FoodFormData } from '@/types/food';

/**
 * Props for BasicInfoSection component
 */
interface BasicInfoSectionProps {
  formData: FoodFormData;
  dict: any;
  onChange: (field: keyof FoodFormData, value: string) => void;
  isLocked?: (field: string) => boolean;
  onToggleLock?: (field: string) => void;
  onFieldError?: (fieldName: string, hasError: boolean) => void;
  isLiquid?: boolean | undefined;
  onLiquidChange?: (isLiquid: boolean | undefined) => void;
}

/**
 * Basic information section component for food form.
 * Includes product name, brand, category, location, price, and liquid checkbox.
 * 
 * @param props - Component props
 * @returns Basic info form section
 */
export default function BasicInfoSection({
  formData,
  dict,
  onChange,
  isLocked,
  onToggleLock,
  onFieldError,
  isLiquid,
  onLiquidChange
}: BasicInfoSectionProps) {
  // Determine if checkbox should be checked
  // If isLiquid is explicitly set (true or false), use that value
  // Otherwise, check based on density_g_per_ml or category
  const shouldBeChecked = isLiquid !== undefined
    ? isLiquid
    : (formData.nutrition_parsed?.density_g_per_ml != null) ||
      formData.category === 'drink' ||
      formData.category === 'alcohol';

  const handleCategoryChange = (value: string) => {
    onChange('category', value);
    // Auto-check liquid if category is drink or alcohol (only if isLiquid hasn't been explicitly set to false)
    if ((value === 'drink' || value === 'alcohol') && isLiquid !== false) {
      onLiquidChange?.(true);
    } else if (isLiquid && value !== 'drink' && value !== 'alcohol') {
      // If changing category away from drink/alcohol and no density, uncheck
      const hasDensity = formData.nutrition_parsed?.density_g_per_ml != null;
      if (!hasDensity) {
        onLiquidChange?.(false);
      }
    }
  };

  const handleLiquidChange = (checked: boolean) => {
    onLiquidChange?.(checked);
    // If unchecking, set density and ABV to null
    if (!checked) {
      onChange('density', null as any);
      onChange('abv_percentage', null as any);
    }
  };
  return (
    <section>
      <h3 className="text-lg font-bold mb-4 text-primary">1. {dict?.pages?.edit?.sectionBasic || 'Basic Metadata'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={dict?.pages?.edit?.labelName || 'Product Name*'}
          name="product_name"
          value={formData.product_name || ''}
          onChange={(value) => onChange('product_name', value)}
          required={true}
          locked={isLocked?.('product_name')}
          onToggleLock={onToggleLock ? () => onToggleLock('product_name') : undefined}
          dict={dict}
        />
        <FormField
          label={dict?.pages?.edit?.labelBrand || 'Brand*'}
          name="brand"
          value={formData.brand && formData.brand !== '(sem marca)' ? formData.brand : ''}
          onChange={(value) => onChange('brand', value || '(sem marca)')}
          placeholder={formData.brand && formData.brand !== '(sem marca)' ? undefined : (dict?.pages?.edit?.noBrand || '(sem marca)')}
          locked={isLocked?.('brand')}
          onToggleLock={onToggleLock ? () => onToggleLock('brand') : undefined}
          dict={dict}
        />
        <FormField
          label={dict?.pages?.edit?.labelLocation || 'Location'}
          name="location"
          value={formData.location || ''}
          onChange={(value) => onChange('location', value || 'Brasil')}
          type="text"
          placeholder={formData.location ? undefined : 'Brasil'}
          locked={isLocked?.('location')}
          onToggleLock={onToggleLock ? () => onToggleLock('location') : undefined}
          dict={dict}
        />
        <NumericField
          label={`${dict?.pages?.edit?.labelNetContent || 'Conteúdo Líquido'} (g ou ml)`}
          name="net_content_g_ml"
          value={formData.net_content_g_ml ?? ''}
          onChange={(value) => onChange('net_content_g_ml', value)}
          step="0.01"
          locked={isLocked?.('net_content_g_ml')}
          onToggleLock={onToggleLock ? () => onToggleLock('net_content_g_ml') : undefined}
          onFieldError={onFieldError}
          dict={dict}
        />
        <div>
          <label className="block text-xs font-bold text-text-main/70 mb-1">
            {dict?.pages?.edit?.labelCategory || 'Category'}
          </label>
          <div className="flex items-center gap-3">
            <select
              value={formData.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="flex-1 bg-background border border-text-main/20 text-text-main p-2 rounded-theme focus:outline-none focus:border-primary h-[42px]"
            >
              <option value="">{dict?.pages?.edit?.labelCategorySelect || 'Select category...'}</option>
              {dict?.categories && Object.entries(dict.categories).map(([key, value]) => (
                <option key={key} value={key}>{value as string}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={shouldBeChecked}
                onChange={(e) => handleLiquidChange(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-text-main/70">
                {dict?.pages?.edit?.labelLiquid || 'Líquido'}
              </span>
            </label>
          </div>
        </div>
        <NumericField
          label={dict?.pages?.edit?.labelPrice || 'Price'}
          name="price"
          value={formData.price !== undefined && formData.price !== null ? formData.price : ''}
          onChange={(value) => onChange('price', value)}
          step="0.01"
          locked={isLocked?.('price')}
          onToggleLock={onToggleLock ? () => onToggleLock('price') : undefined}
          onFieldError={onFieldError}
          dict={dict}
        />
      </div>
    </section>
  );
}

