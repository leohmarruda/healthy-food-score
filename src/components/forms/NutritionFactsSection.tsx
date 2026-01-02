'use client';
import FormField from './FormField';
import NumericField from './NumericField';
import type { FoodFormData } from '@/types/food';
import { formatHFSScore } from '@/utils/form-helpers';

interface NutritionFactsSectionProps {
  formData: FoodFormData;
  dict: any;
  isDirty: boolean;
  onChange: (field: keyof FoodFormData, value: string) => void;
  isLocked?: (field: string) => boolean;
  onToggleLock?: (field: string) => void;
  onFieldError?: (fieldName: string, hasError: boolean) => void;
}

const NUTRITION_FIELDS = [
  { labelKey: 'serving', field: 'serving_size_value', type: 'number' as const, unit: '', step: '1' },
  { labelKey: 'unit', field: 'serving_size_unit', type: 'text' as const, unit: '' },
  { labelKey: 'calories', field: 'energy_kcal', type: 'number' as const, unit: '(kcal)', step: '1' },
  { labelKey: 'protein', field: 'protein_g', type: 'number' as const, unit: '(g)', step: '0.1' },
  { labelKey: 'carbs', field: 'carbs_total_g', type: 'number' as const, unit: '(g)', step: '0.1' },
  { labelKey: 'fat', field: 'fat_total_g', type: 'number' as const, unit: '(g)', step: '0.1' },
  { labelKey: 'sodium', field: 'sodium_mg', type: 'number' as const, unit: '(mg)', step: '1' },
  { labelKey: 'fiber', field: 'fiber_g', type: 'number' as const, unit: '(g)', step: '0.1' },
  { labelKey: 'saturatedFat', field: 'saturated_fat_g', type: 'number' as const, unit: '(g)', step: '0.1' }
];

export default function NutritionFactsSection({
  formData,
  dict,
  isDirty,
  onChange,
  isLocked,
  onToggleLock,
  onFieldError
}: NutritionFactsSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-bold mb-4 text-primary">2. {dict?.pages?.edit?.sectionNutrition || dict?.components?.nutritionLabel?.factsTitle || 'Dados Nutricionais'}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {NUTRITION_FIELDS.map(({ labelKey, field, type, unit, step }) => {
          const nutritionDict = dict?.components?.nutritionLabel || {};
          const baseLabel = nutritionDict[labelKey] || field;
          const label = unit ? `${baseLabel} ${unit}` : baseLabel;
          
          if (type === 'number') {
            return (
              <NumericField
                key={field}
                label={label}
                name={field as keyof FoodFormData}
                value={formData[field as keyof FoodFormData] as string | number}
                onChange={(value) => onChange(field as keyof FoodFormData, value)}
                step={step}
                locked={isLocked?.(field)}
                onToggleLock={onToggleLock ? () => onToggleLock(field) : undefined}
                dict={dict}
              />
            );
          }
          
          // Special handling for serving_size_unit - render as dropdown
          if (field === 'serving_size_unit') {
            return (
              <div key={field}>
                <label className="block text-xs font-bold text-text-main/70 mb-1 flex items-center gap-1.5">
                  <span>{label.replace(/\*$/, '')}</span>
                  {onToggleLock && (
                    <button
                      type="button"
                      onClick={() => onToggleLock(field)}
                      className="ml-auto flex-shrink-0"
                      title={isLocked?.(field) 
                        ? (dict?.components?.forms?.formField?.unlockFieldTooltip || 'Unlock field (allow auto-update)')
                        : (dict?.components?.forms?.formField?.lockFieldTooltip || 'Lock field (prevent auto-update)')}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-colors ${
                          isLocked?.(field) ? 'text-primary' : 'text-text-main/30 hover:text-text-main/50'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {isLocked?.(field) ? (
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
                </label>
                <select
                  value={formData[field as keyof FoodFormData] as string || ''}
                  onChange={(e) => onChange(field as keyof FoodFormData, e.target.value)}
                  disabled={isLocked?.(field)}
                  className={`w-full bg-background border border-text-main/20 text-text-main p-2 rounded-theme ${
                    isLocked?.(field) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">—</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            );
          }
          
          return (
            <FormField
              key={field}
              label={label}
              name={field as keyof FoodFormData}
              value={formData[field as keyof FoodFormData] as string | number}
              onChange={(value) => onChange(field as keyof FoodFormData, value)}
              type={type}
              locked={isLocked?.(field)}
              onToggleLock={onToggleLock ? () => onToggleLock(field) : undefined}
              dict={dict}
            />
          );
        })}
        {/* ABV - Alcohol by Volume */}
        <NumericField
          label={dict?.pages?.edit?.labelABV || 'ABV (%) - Alcohol by Volume'}
          name="abv_percentage"
          value={formData.abv_percentage ?? ''}
          onChange={(value) => onChange('abv_percentage', value)}
          step="0.1"
          max={100}
          locked={isLocked?.('abv_percentage')}
          onToggleLock={onToggleLock ? () => onToggleLock('abv_percentage') : undefined}
          onFieldError={onFieldError}
          dict={dict}
        />
        {/* NOVA Classification */}
        <NumericField
          label={dict?.pages?.edit?.labelNOVA || 'NOVA (v1)'}
          name="NOVA"
          value={formData.NOVA ?? ''}
          onChange={(value) => onChange('NOVA', value)}
          step="1"
          integerOnly={true}
          locked={isLocked?.('NOVA')}
          onToggleLock={onToggleLock ? () => onToggleLock('NOVA') : undefined}
          onFieldError={onFieldError}
          dict={dict}
          infoTooltip={'1 – in natura ou minimamente processado (frutas, legumes, grãos integrais, leite, carne in natura)\n2 – ingredientes culinários processados (óleo, açúcar, sal, manteiga, etc., usados em combinação simples)\n3 – processados (pão simples, queijos, conservas salgadas etc., poucos ingredientes)\n4 – ultraprocessados (vários aditivos, "aromatizante", "realçador de sabor", "gordura vegetal hidrogenada", etc.)'}
        />
        {/* Density */}
        <NumericField
          label={`${dict?.pages?.edit?.labelDensity || dict?.hfsScores?.density || 'Densidade'} (g/ml)`}
          name="density"
          value={formData.density ?? ''}
          onChange={(value) => onChange('density', value || '1.0')}
          step="0.01"
          defaultValue={1.0}
          showDefaultAsItalic={true}
          locked={isLocked?.('density')}
          onToggleLock={onToggleLock ? () => onToggleLock('density') : undefined}
          onFieldError={onFieldError}
          dict={dict}
        />
      </div>
    </section>
  );
}

