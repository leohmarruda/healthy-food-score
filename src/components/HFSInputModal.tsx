'use client';
import { useState, useEffect } from 'react';
import { getConversionFactor, convertNutrientsTo100g, convertNutrientsFrom100g } from '@/utils/hfs-conversion';
import { getDefaultValueConfig, DefaultValueIcon, getPlaceholderClasses, getNoneText } from '@/utils/field-helpers';

interface HFSInputModalProps {
  isOpen: boolean;
  version?: string; // HFS version (v1, v2)
  scores?: {
    s1a?: number; // Açúcares adicionados (g)
    s1b?: number; // Açúcares naturais (g)
    s2?: number; // Fibras (g)
    s3a?: number; // Gordura Saturada (g)
    s3b?: number; // Gordura Trans (g)
    s4?: number; // Densidade calórica (kcal)
    s5?: number; // Proteína (g)
    s6?: number; // Sódio (mg)
    s7?: number; // Grau de processamento (NOVA)
    s8?: number; // Aditivos artificiais (lista)
    s9?: number; // ABV - Alcohol by Volume (%)
    density?: number; // Density (g/ml)
  };
  formData?: {
    product_name?: string;
    brand?: string;
    net_content_g_ml?: number;
    ingredients_list?: string[];
    energy_kcal?: number;
    carbs_total_g?: number;
    protein_g?: number;
    sodium_mg?: number;
    fiber_g?: number;
    fat_total_g?: number;
    saturated_fat_g?: number;
    trans_fat_g?: number;
    sugars_added_g?: number;
    sugars_total_g?: number;
    NOVA?: number;
    n_ing?: number;
    abv_percentage?: number;
    declared_processes?: string;
    declared_special_nutrients?: string;
    certifications?: string;
    location?: string;
    serving_size_value?: number;
    serving_size_unit?: string;
    density?: number;
  };
  servingSize?: number;
  servingUnit?: string;
  density?: number;
  isLiquid?: boolean;
  onLiquidChange?: (isLiquid: boolean) => void;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  dict?: any;
}

export default function HFSInputModal({
  isOpen,
  version = 'v1',
  scores: initialScores,
  formData: initialFormData,
  servingSize,
  servingUnit,
  density,
  isLiquid: externalIsLiquid,
  onLiquidChange,
  onConfirm,
  onCancel,
  dict
}: HFSInputModalProps) {
  const [scores, setScores] = useState(initialScores || {});
  const [formData, setFormData] = useState(initialFormData || {});
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());

  const t = dict?.hfsScores || {};
  const isV2 = version === 'v2';

  // Use external isLiquid if provided, otherwise derive from form data
  const isLiquid = externalIsLiquid !== undefined 
    ? externalIsLiquid
    : (isV2
        ? ((initialFormData as any)?.nutrition_parsed?.density_g_per_ml != null) ||
          (initialFormData?.abv_percentage != null && initialFormData.abv_percentage > 0) ||
          (initialFormData?.density != null)
        : (initialScores?.density != null && initialScores.density !== 1.0) ||
          (density != null && density !== 1.0));

  const handleLiquidChange = (checked: boolean) => {
    onLiquidChange?.(checked);
    // Set density and ABV to undefined when unchecking
    if (!checked) {
      if (isV2) {
        setFormData(prev => ({ ...prev, abv_percentage: undefined, density: undefined }));
      } else {
        setScores(prev => ({ ...prev, s9: undefined, density: undefined }));
      }
    }
  };

  const conversionParams = {
    servingSize: servingSize || formData.serving_size_value,
    servingUnit: servingUnit || formData.serving_size_unit,
    density: density || formData.density,
  };

  useEffect(() => {
    if (!isOpen) return;
    
    if (isV2) {
      const nutrientFields = ['energy_kcal', 'carbs_total_g', 'protein_g', 'sodium_mg', 'fiber_g', 'fat_total_g', 'saturated_fat_g', 'trans_fat_g', 'sugars_added_g'];
      // Extract only numeric fields for conversion
      const numericData: Record<string, number | null | undefined> = {};
      nutrientFields.forEach(field => {
        numericData[field] = initialFormData?.[field as keyof typeof initialFormData] as number | undefined;
      });
      const converted = convertNutrientsTo100g(numericData, nutrientFields, conversionParams);
      setFormData({ ...initialFormData, ...converted });
    } else {
      // For v1, use formData directly with all fields
      const v1Fields = ['serving_size_value', 'energy_kcal', 'carbs_total_g', 'sugars_total_g', 'sugars_added_g', 
                         'fiber_g', 'fat_total_g', 'saturated_fat_g', 'trans_fat_g', 'protein_g', 'sodium_mg', 'NOVA', 'n_ing'];
      const numericData: Record<string, number | null | undefined> = {};
      v1Fields.forEach(field => {
        numericData[field] = initialFormData?.[field as keyof typeof initialFormData] as number | undefined;
      });
      // Also include abv_percentage and density
      numericData['abv_percentage'] = initialFormData?.abv_percentage;
      numericData['density'] = density ?? initialFormData?.density ?? 1.0;
      setFormData({ ...initialFormData, ...numericData });
    }
  }, [isOpen, initialScores, initialFormData, isV2, density, servingSize, servingUnit]);

  if (!isOpen) return null;

  // V1 fields - using direct field names in the order specified in hfs-calculations.ts
  const v1Fields = [
    { key: 'serving_size_value', description: dict?.components?.nutritionLabel?.serving || 'Tamanho da Porção', unit: 'g', type: 'number' },
    { key: 'energy_kcal', description: dict?.components?.nutritionLabel?.calories || 'Energia', unit: 'kcal', type: 'number' },
    { key: 'carbs_total_g', description: dict?.components?.nutritionLabel?.carbs || 'Carboidratos totais', unit: 'g', type: 'number' },
    { key: 'sugars_total_g', description: dict?.components?.nutritionLabel?.sugarsTotal || 'Açúcares totais', unit: 'g', type: 'number' },
    { key: 'sugars_added_g', description: dict?.components?.nutritionLabel?.sugarsAdded || 'Açúcares adicionados', unit: 'g', type: 'number' },
    { key: 'fiber_g', description: dict?.components?.nutritionLabel?.fiber || 'Fibras', unit: 'g', type: 'number' },
    { key: 'fat_total_g', description: dict?.components?.nutritionLabel?.fat || 'Gorduras Totais', unit: 'g', type: 'number' },
    { key: 'saturated_fat_g', description: dict?.components?.nutritionLabel?.saturatedFat || 'Gordura Saturada', unit: 'g', type: 'number' },
    { key: 'trans_fat_g', description: dict?.components?.nutritionLabel?.transFat || 'Gordura Trans', unit: 'g', type: 'number' },
    { key: 'protein_g', description: dict?.components?.nutritionLabel?.protein || 'Proteína', unit: 'g', type: 'number' },
    { key: 'sodium_mg', description: dict?.components?.nutritionLabel?.sodium || 'Sódio', unit: 'mg', type: 'number' },
    { key: 'NOVA', description: t.s7Description || 'Grau de processamento (NOVA)', unit: '', type: 'number' },
    { key: 'n_ing', description: t.nIngredientsLabel || 'Número de Ingredientes', unit: '', type: 'number' },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  // V1 liquid fields (shown when isLiquid is true)
  const v1LiquidFields = [
    { key: 'abv_percentage', description: t.s9Description || 'ABV - Teor Alcoólico', unit: '%', type: 'number' },
    { key: 'density', description: t.densityDescription || 'Densidade', unit: 'g/ml', type: 'number' },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  // V2 fields - ingredients_list is separate, then special fields, then subtitle, then nutrients
  const v2IngredientsField = {
    key: 'ingredients_list',
    description: t.v2IngredientsList || 'Lista de ingredientes',
    type: 'text' as const,
    label: t.v2IngredientsList || 'Lista de ingredientes'
  };

  // Fields that go right after ingredients list
  const v2SpecialFields = [
    { key: 'serving_size_value', description: t.v2ServingSize || 'Tamanho da Porção', unit: 'g', type: 'number' as const },
    { key: 'location', description: dict?.pages?.edit?.labelLocation || 'Localização', type: 'text' as const, isTextArea: false },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  // Declaration fields - shown in "DECLARAÇÕES DA EMBALAGEM" section
  const v2DeclarationFields = [
    { key: 'declared_processes', description: t.v2DeclaredProcesses || 'Processos declarados', type: 'text' as const, isTextArea: true },
    { key: 'declared_special_nutrients', description: t.v2DeclaredSpecialNutrients || 'Nutrientes especiais declarados', type: 'text' as const, isTextArea: true },
    { key: 'certifications', description: dict?.pages?.edit?.labelCertifications || 'Certificações', type: 'text' as const, isTextArea: true },
  ].map(field => ({
    ...field,
    label: field.description
  }));

  // Nutrient fields (after subtitle) - abv_percentage removed, will be shown conditionally
  const v2NutrientFields = [
    { key: 'energy_kcal', description: t.v2Energy || 'Energia', unit: 'kcal', type: 'number' as const },
    { key: 'carbs_total_g', description: t.v2CarbsTotal || 'Carboidratos totais', unit: 'g', type: 'number' as const },
    { key: 'protein_g', description: t.v2Protein || 'Proteínas', unit: 'g', type: 'number' as const },
    { key: 'sodium_mg', description: t.v2Sodium || 'Sódio', unit: 'mg', type: 'number' as const },
    { key: 'fiber_g', description: t.v2Fiber || 'Fibra alimentar', unit: 'g', type: 'number' as const },
    { key: 'fat_total_g', description: t.v2TotalFat || 'Gordura total', unit: 'g', type: 'number' as const },
    { key: 'saturated_fat_g', description: t.v2SaturatedFat || 'Gordura saturada', unit: 'g', type: 'number' as const },
    { key: 'trans_fat_g', description: t.v2TransFat || 'Gordura trans', unit: 'g', type: 'number' as const },
    { key: 'sugars_added_g', description: t.v2AddedSugars || 'Açúcar adicionado', unit: 'g', type: 'number' as const },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  // V2 liquid fields (shown when isLiquid is true)
  const v2LiquidFields = [
    { key: 'abv_percentage', description: t.v2ABV || 'ABV', unit: '%', type: 'number' as const },
    { key: 'density', description: t.densityDescription || 'Densidade', unit: 'g/ml', type: 'number' as const },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  const fields = isV2 ? [...v2NutrientFields] : [...v1Fields];

  const handleChange = (key: string, value: string) => {
    // Handle text fields (product_name, brand)
    if (key === 'product_name' || key === 'brand') {
      setFormData(prev => ({
        ...prev,
        [key]: value || undefined
      }));
      return;
    }
    
    if (isV2) {
      if (key === 'ingredients_list') {
        // For V2, store as string but convert to array for formData compatibility
        // The textarea will display/edit as string, but we'll convert to array when needed
        const list = value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
        setFormData(prev => ({
          ...prev,
          [key]: list.length > 0 ? list : undefined
        }));
      } else if (key === 'declared_processes' || key === 'declared_special_nutrients' || key === 'certifications' || key === 'location') {
        // Text fields - remove "(nenhum)" if user starts typing
        const cleanValue = value === (t.none || '(nenhum)') ? '' : value;
        setFormData(prev => ({
          ...prev,
          [key]: cleanValue || undefined
        }));
      } else {
        // Number fields
        const numValue = value === '' ? undefined : parseFloat(value);
        setFormData(prev => ({
          ...prev,
          [key]: isNaN(numValue as number) ? undefined : numValue
        }));
      }
    } else {
      // For v1, use formData directly
      if (key === 'ingredients_list') {
        // Split by comma and trim
        const list = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({
          ...prev,
          [key]: list
        }));
      } else if (key === 'NOVA' || key === 'n_ing') {
        // For NOVA and n_ing, parse as integer
        const intValue = value === '' ? undefined : parseInt(value, 10);
        setFormData(prev => ({
          ...prev,
          [key]: isNaN(intValue as number) ? undefined : intValue
        }));
      } else {
        const numValue = value === '' ? undefined : parseFloat(value);
        setFormData(prev => ({
          ...prev,
          [key]: isNaN(numValue as number) ? undefined : numValue
        }));
      }
    }
  };

  const handleConfirm = () => {
    if (isV2) {
      const nutrientFields = ['energy_kcal', 'carbs_total_g', 'protein_g', 'sodium_mg', 'fiber_g', 'fat_total_g', 'saturated_fat_g', 'trans_fat_g', 'sugars_added_g'];
      // Extract only numeric fields for conversion
      const numericData: Record<string, number | null | undefined> = {};
      nutrientFields.forEach(field => {
        numericData[field] = formData[field as keyof typeof formData] as number | undefined;
      });
      const converted = convertNutrientsFrom100g(numericData, nutrientFields, conversionParams); 
      const result = { 
        ...formData, 
        ...converted,
        product_name: formData.product_name,
        brand: formData.brand
      };
      // Include ABV and density if isLiquid is true, otherwise set to null
      if (isLiquid) {
        result.abv_percentage = formData.abv_percentage ?? 0;
        result.density = formData.density ?? 1.0;
      } else {
        result.abv_percentage = undefined;
        result.density = undefined;
      }
      onConfirm(result);
    } else {
      // For v1, return formData directly with all fields
      const v1Fields = ['serving_size_value', 'energy_kcal', 'carbs_total_g', 'sugars_total_g', 'sugars_added_g',
                        'fiber_g', 'fat_total_g', 'saturated_fat_g', 'trans_fat_g', 'protein_g', 'sodium_mg', 'NOVA', 'n_ing'];
      const result: any = {
        product_name: formData.product_name,
        brand: formData.brand,
        ingredients_list: formData.ingredients_list
      };
      v1Fields.forEach(field => {
        const value = formData[field as keyof typeof formData];
        // For NOVA and n_ing, ensure they're integers if provided
        if (field === 'NOVA' || field === 'n_ing') {
          result[field] = value !== undefined && value !== null ? Math.round(value as number) : undefined;
        } else {
          result[field] = value !== undefined && value !== null ? value : 0;
        }
      });
      // Include abv_percentage and density if isLiquid is true, otherwise set to null
      if (isLiquid) {
        result.abv_percentage = formData.abv_percentage !== undefined && formData.abv_percentage !== null ? formData.abv_percentage : 0;
        result.density = formData.density ?? density ?? 1.0;
      } else {
        result.abv_percentage = null;
        result.density = null;
      }
      onConfirm(result);
    }
  };

  const getFieldValue = (key: string) => {
    if (isV2) {
      if (key === 'ingredients_list') {
        return Array.isArray(formData.ingredients_list) ? formData.ingredients_list.join(', ') : '';
      }
      const value = formData[key as keyof typeof formData];
      return value !== undefined && value !== null ? value : '';
    } else {
      // For v1, use formData directly
      if (key === 'ingredients_list') {
        return Array.isArray(formData.ingredients_list) ? formData.ingredients_list.join(', ') : '';
      }
      if (key === 'density') {
        return formData.density !== undefined && formData.density !== null ? formData.density : (density ?? 1.0);
      }
      // NOVA should not default to 0
      if (key === 'NOVA') {
        const value = formData[key as keyof typeof formData];
        return value !== undefined && value !== null ? value : '';
      }
      // All other numeric fields default to 0
      const value = formData[key as keyof typeof formData];
      return value !== undefined && value !== null ? value : 0;
    }
  };

  // Check if a field value is null/undefined (presumed to be 0)
  const isPresumedZero = (key: string): boolean => {
    // Don't show as presumed zero if field is currently focused
    if (focusedFields.has(key)) return false;
    
    // Don't show NOVA as presumed zero
    if (key === 'NOVA') return false;
    
    if (isV2) {
      if (key === 'ingredients_list') return false;
      const value = formData[key as keyof typeof formData];
      return value === undefined || value === null;
    } else {
      if (key === 'density') {
        // Density defaults to 1.0, so only show as zero if explicitly 0
        return formData.density === 0;
      }
      const value = formData[key as keyof typeof formData];
      return value === undefined || value === null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-text-main/10 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-text-main">
              {t.inputTitle || 'Editar Dados HFS'} {version.toUpperCase()}
            </h3>
            <button
              onClick={onCancel}
              className="text-text-main/60 hover:text-text-main text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-text-main/10 transition"
            >
              ×
            </button>
          </div>

          {isV2 ? (
            <>
              {/* Product name and brand - shown as labels at the top for V2 */}
              <div className="mb-4 space-y-3">
                {/* Product name - larger font, no label */}
                <div className="text-lg font-semibold text-text-main">
                  {getFieldValue('product_name') || '—'}
                </div>
                {/* Brand - no label */}
                <div className="text-sm text-text-main/80">
                  {getFieldValue('brand') || '—'}
                </div>
              </div>

              {/* Ingredients list - editable textarea for V2 */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                  <span>{v2IngredientsField.label}</span>
                </label>
                <textarea
                  value={getFieldValue('ingredients_list') || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    handleChange('ingredients_list', newValue);
                  }}
                  onFocus={() => setFocusedFields(prev => new Set(prev).add('ingredients_list'))}
                  onBlur={() => {
                    setFocusedFields(prev => {
                      const next = new Set(prev);
                      next.delete('ingredients_list');
                      return next;
                    });
                  }}
                  placeholder={getNoneText(dict)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Liquid checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLiquid}
                    onChange={(e) => handleLiquidChange(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-text-main/80">
                    {dict?.pages?.edit?.labelLiquid || 'Líquido'}
                  </span>
                </label>
              </div>

              {/* Special fields: serving size and location */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {v2SpecialFields.map((field) => {
                  const { key, label, type, isTextArea: fieldIsTextArea } = field as typeof field & { isTextArea?: boolean };
                  const rawValue = getFieldValue(key);
                  const isTextArea = fieldIsTextArea !== undefined ? fieldIsTextArea : (type !== 'number');
                  const isDeclaredField = key === 'location';
                  const noneText = getNoneText(dict);
                  const isEmpty = !rawValue || rawValue === '';
                  const presumedZero = !isTextArea && !isDeclaredField && isPresumedZero(key);
                  const isFocused = focusedFields.has(key);
                  const displayValue = isTextArea 
                    ? (isDeclaredField && isEmpty ? '' : String(rawValue || ''))
                    : (isDeclaredField && isEmpty ? '' : (presumedZero && !isFocused ? '' : String(rawValue || '')));
                  
                  // Get default value configuration
                  // Convert array to string for getDefaultValueConfig (it expects string | number | undefined)
                  const configValue = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue;
                  // For numeric fields without a specific default, use 0 as default
                  const numericDefaultValue = !isTextArea && presumedZero ? 0 : undefined;
                  const defaultConfig = getDefaultValueConfig({
                    value: configValue,
                    defaultValue: numericDefaultValue,
                    showDefaultAsItalic: presumedZero,
                    placeholder: isDeclaredField && isEmpty ? noneText : (presumedZero ? '0' : undefined),
                    isFocused,
                    dict
                  });
                  
                  return (
                    <div key={key} className={`flex flex-col ${isTextArea ? 'col-span-2' : ''}`}>
                      <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                        <span>{label}</span>
                        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
                      </label>
                      {isTextArea ? (
                        <textarea
                          value={displayValue}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue === '' || newValue === noneText) {
                              handleChange(key, '');
                            } else {
                              handleChange(key, newValue);
                            }
                          }}
                          onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                          onBlur={() => {
                            setFocusedFields(prev => {
                              const next = new Set(prev);
                              next.delete(key);
                              return next;
                            });
                          }}
                          placeholder={defaultConfig.placeholder}
                          rows={2}
                          className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary resize-none ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                        />
                      ) : (
                        <input
                          type={type === 'number' ? 'number' : 'text'}
                          step={type === 'number' ? (key === 'serving_size_value' ? '1' : '0.1') : undefined}
                          value={displayValue}
                          onChange={(e) => {
                            if (type === 'text') {
                              const newValue = e.target.value;
                              if (newValue === '' || newValue === noneText) {
                                handleChange(key, '');
                              } else {
                                handleChange(key, newValue);
                              }
                            } else {
                              handleChange(key, e.target.value);
                            }
                          }}
                          onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                          onBlur={() => {
                            setFocusedFields(prev => {
                              const next = new Set(prev);
                              next.delete(key);
                              return next;
                            });
                          }}
                          placeholder={defaultConfig.placeholder || '—'}
                          className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Subtitle */}
              <h4 className="text-xs font-bold text-text-main/60 mb-2 uppercase">
                {t.nutrientsSubtitle || 'Nutrientes calculados para 100g'}
              </h4>

              {/* Nutrient fields */}
              <div className="grid grid-cols-2 gap-3">
                {fields.map(({ key, label, type }) => {
                  // Skip abv_percentage and density from main fields - they'll be shown separately
                  if (key === 'abv_percentage' || key === 'density') return null;
                  
                  const rawValue = getFieldValue(key);
                  const isFocused = focusedFields.has(key);
                  // Check if field is empty (undefined, null, or empty string)
                  const isEmpty = rawValue === undefined || rawValue === null || rawValue === '' || rawValue === 0 || rawValue === '0';
                  const displayValue = isEmpty && !isFocused ? '' : String(rawValue || '');
                  
                  // Get default value configuration
                  // Convert array to string for getDefaultValueConfig (it expects string | number | undefined)
                  const configValue = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue;
                  // All numeric fields in v2 should have defaultValue: 0 when empty
                  const defaultConfig = getDefaultValueConfig({
                    value: configValue,
                    defaultValue: isEmpty ? 0 : undefined,
                    showDefaultAsItalic: isEmpty,
                    placeholder: isEmpty ? '0' : undefined,
                    isFocused,
                    dict
                  });
                  
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                        <span>{label}</span>
                        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
                      </label>
                      <input
                        type={type}
                        step="0.1"
                        value={displayValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                        onBlur={() => {
                          setFocusedFields(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                          });
                        }}
                        placeholder={defaultConfig.placeholder || '—'}
                        className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                      />
                    </div>
                  );
                })}
                {/* Liquid fields - shown at the end when isLiquid is true */}
                {isLiquid && v2LiquidFields.map(({ key, label, type }) => {
                  const value = getFieldValue(key);
                  const presumedZero = isPresumedZero(key);
                  const isFocused = focusedFields.has(key);
                  const displayValue = presumedZero && !isFocused ? '' : String(value || '');
                  
                  const configValue = Array.isArray(value) ? value.join(', ') : value;
                  const defaultConfig = getDefaultValueConfig({
                    value: configValue,
                    defaultValue: key === 'density' ? 1.0 : (presumedZero ? 0 : undefined),
                    showDefaultAsItalic: presumedZero || key === 'density',
                    placeholder: presumedZero ? '0' : (key === 'density' ? '1.0' : undefined),
                    isFocused,
                    dict
                  });
                  
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                        <span>{label}</span>
                        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
                      </label>
                      <input
                        type={type}
                        step={key === 'abv_percentage' ? '0.1' : '0.01'}
                        value={displayValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                        onBlur={() => {
                          setFocusedFields(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                          });
                        }}
                        placeholder={defaultConfig.placeholder || '—'}
                        className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* DECLARAÇÕES DA EMBALAGEM section */}
              <h4 className="text-xs font-bold text-text-main/60 mb-2 uppercase mt-4">
                {dict?.hfsScores?.packageDeclarationsTitle || 'DECLARAÇÕES DA EMBALAGEM'}
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {v2DeclarationFields.map((field) => {
                  const { key, label } = field;
                  const rawValue = getFieldValue(key);
                  const noneText = getNoneText(dict);
                  const isEmpty = !rawValue || rawValue === '';
                  const isFocused = focusedFields.has(key);
                  const displayValue = isEmpty ? '' : String(rawValue || '');
                  
                  // Get default value configuration
                  const configValue = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue;
                  const defaultConfig = getDefaultValueConfig({
                    value: configValue,
                    defaultValue: undefined,
                    showDefaultAsItalic: false,
                    placeholder: isEmpty ? noneText : undefined,
                    isFocused,
                    dict
                  });
                  
                  return (
                    <div key={key} className="flex flex-col col-span-2">
                      <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                        <span>{label}</span>
                        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
                      </label>
                      <textarea
                        value={displayValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (newValue === '' || newValue === noneText) {
                            handleChange(key, '');
                          } else {
                            handleChange(key, newValue);
                          }
                        }}
                        onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                        onBlur={() => {
                          setFocusedFields(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                          });
                        }}
                        placeholder={defaultConfig.placeholder}
                        rows={2}
                        className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary resize-none ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Product name, brand, and ingredients list - shown as text at the top for V1 */}
              <div className="mb-4 space-y-3">
                {/* Product name - larger font */}
                <div className="text-lg font-semibold text-text-main">
                  {getFieldValue('product_name') || '—'}
                </div>
                {/* Brand */}
                <div className="text-sm text-text-main/80">
                  {getFieldValue('brand') || '—'}
                </div>
                {/* Ingredients list - as plain text */}
                <div className="text-sm text-text-main">
                  <span className="font-medium">Ingredientes: </span>
                  {getFieldValue('ingredients_list') || '—'}
                </div>
              </div>

              {/* Liquid checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLiquid}
                    onChange={(e) => handleLiquidChange(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-text-main/80">
                    {dict?.pages?.edit?.labelLiquid || 'Líquido'}
                  </span>
                </label>
              </div>

              <h4 className="text-xs font-bold text-text-main/60 mb-2 uppercase">
                {t.parametersSubtitle || 'Dados'}
                <span className="normal-case font-normal text-text-main/50 ml-2">
                  (para a porção padrão de 100g)
                </span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {fields.filter(({ key }) => key !== 'ingredients_list').map(({ key, label, type }) => {
              const rawValue = getFieldValue(key);
              const isNIng = key === 'n_ing';
              const isTextArea = type === 'text' && (key === 'declared_processes' || key === 'declared_special_nutrients');
              const isDeclaredField = key === 'declared_processes' || key === 'declared_special_nutrients';
              const noneText = getNoneText(dict);
              const isEmpty = !rawValue || rawValue === '';
              const showNone = isNIng && isEmpty;
              // NOVA should not be presumed zero, all other numeric fields should
              const presumedZero = isPresumedZero(key) && !isNIng && key !== 'NOVA';
              const isFocused = focusedFields.has(key);
              
              // Determine placeholder
              let placeholder: string | undefined = undefined;
              if (isNIng && showNone) {
                placeholder = noneText;
              } else if (isDeclaredField && isEmpty) {
                placeholder = noneText;
              } else if (key === 'density' && (rawValue === undefined || rawValue === null || rawValue === '')) {
                placeholder = '1.0';
              } else if (presumedZero) {
                placeholder = '0';
              }
              
              const displayValue = isTextArea
                ? (isDeclaredField && isEmpty ? '' : String(rawValue || ''))
                : (showNone ? '' : (presumedZero && !isFocused ? '' : String(rawValue || '')));
              
              // Get default value configuration
              // Convert array to string for getDefaultValueConfig (it expects string | number | undefined)
              const configValue = isDeclaredField && isEmpty ? '' : (Array.isArray(rawValue) ? rawValue.join(', ') : rawValue);
              // For numeric fields (except NOVA), use 0 as default when empty
              const hasDefaultZero = type === 'number' && key !== 'NOVA' && key !== 'density';
              const numericDefaultValue = hasDefaultZero && (isEmpty || rawValue === 0 || rawValue === '0') ? 0 : undefined;
              const defaultConfig = getDefaultValueConfig({
                value: configValue,
                defaultValue: key === 'density' ? 1.0 : numericDefaultValue,
                showDefaultAsItalic: (presumedZero && hasDefaultZero) || key === 'density',
                placeholder,
                isFocused,
                dict
              });
              
              return (
                <div key={key} className={`flex flex-col ${isTextArea ? 'col-span-2' : ''}`}>
                  <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                    <span>{label}</span>
                    {key === 'NOVA' && (
                      <svg
                        className="w-4 h-4 text-text-main/50 hover:text-text-main/70 flex-shrink-0 cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label={'1 – in natura ou minimamente processado (frutas, legumes, grãos integrais, leite, carne in natura)\n2 – ingredientes culinários processados (óleo, açúcar, sal, manteiga, etc., usados em combinação simples)\n3 – processados (pão simples, queijos, conservas salgadas etc., poucos ingredientes)\n4 – ultraprocessados (vários aditivos, "aromatizante", "realçador de sabor", "gordura vegetal hidrogenada", etc.)'}
                      >
                        <title>{'1 – in natura ou minimamente processado (frutas, legumes, grãos integrais, leite, carne in natura)\n2 – ingredientes culinários processados (óleo, açúcar, sal, manteiga, etc., usados em combinação simples)\n3 – processados (pão simples, queijos, conservas salgadas etc., poucos ingredientes)\n4 – ultraprocessados (vários aditivos, "aromatizante", "realçador de sabor", "gordura vegetal hidrogenada", etc.)'}</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
                  </label>
                  {isTextArea ? (
                    <textarea
                      value={displayValue}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue === '' || newValue === noneText) {
                          handleChange(key, '');
                        } else {
                          handleChange(key, newValue);
                        }
                      }}
                      onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                      onBlur={() => {
                        setFocusedFields(prev => {
                          const next = new Set(prev);
                          next.delete(key);
                          return next;
                        });
                      }}
                      placeholder={defaultConfig.placeholder || '—'}
                      rows={2}
                      className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary resize-none ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                    />
                  ) : (
                    <input
                      type={type}
                        step={key === 'NOVA' || key === 'n_ing' ? '1' : '0.1'}
                      value={displayValue}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                      onBlur={(e) => {
                        // Round numeric values to 2 decimal places on blur (for v1 only)
                        if (!isV2 && type === 'number') {
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            const rounded = Math.round(numValue * 100) / 100;
                            handleChange(key, String(rounded));
                          }
                        }
                        setFocusedFields(prev => {
                          const next = new Set(prev);
                          next.delete(key);
                          return next;
                        });
                      }}
                      placeholder={defaultConfig.placeholder || '—'}
                      className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                    />
                  )}
                </div>
              );
            })}
                {/* Liquid fields - shown at the end when isLiquid is true */}
                {isLiquid && v1LiquidFields.map(({ key, label, type }) => {
                  const rawValue = getFieldValue(key);
                  const presumedZero = isPresumedZero(key);
                  const isFocused = focusedFields.has(key);
                  const displayValue = presumedZero && !isFocused ? '' : String(rawValue || '');
                  
                  // Convert array to string for getDefaultValueConfig (it expects string | number | undefined)
                  const configValue = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue;
                  const defaultConfig = getDefaultValueConfig({
                    value: configValue,
                    defaultValue: key === 'density' ? 1.0 : (presumedZero ? 0 : undefined),
                    showDefaultAsItalic: presumedZero || key === 'density',
                    placeholder: presumedZero ? '0' : (key === 'density' ? '1.0' : undefined),
                    isFocused,
                    dict
                  });
                  
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-xs font-medium text-text-main/80 mb-1 flex items-center gap-1.5">
                        <span>{label}</span>
                        {defaultConfig.showIcon && <DefaultValueIcon tooltipText={defaultConfig.tooltipText} />}
                      </label>
                      <input
                        type={type}
                        step={key === 'abv_percentage' ? '0.1' : '0.01'}
                        value={displayValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onFocus={() => setFocusedFields(prev => new Set(prev).add(key))}
                        onBlur={(e) => {
                          // Round numeric values to 2 decimal places on blur
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            const rounded = Math.round(numValue * 100) / 100;
                            handleChange(key, String(rounded));
                          }
                          setFocusedFields(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                          });
                        }}
                        placeholder={defaultConfig.placeholder || '—'}
                        className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-3 bg-text-main/5 border-t border-text-main/10">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-theme font-bold text-sm text-text-main bg-text-main/10 hover:bg-text-main/20 transition"
          >
            {dict?.common?.cancel || 'Cancelar'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isV2 && (formData.NOVA === undefined || formData.NOVA === null)}
            className="px-4 py-1.5 rounded-theme font-bold text-sm text-white bg-primary hover:opacity-90 transition shadow-lg disabled:bg-text-main/20 disabled:text-text-main/50 disabled:cursor-not-allowed"
          >
            {t.confirm || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

