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
  };
  formData?: {
    ingredients_list?: string[];
    energy_kcal?: number;
    carbs_total_g?: number;
    protein_g?: number;
    sodium_mg?: number;
    fiber_g?: number;
    saturated_fat_g?: number;
    trans_fat_g?: number;
    abv_percentage?: number;
    declared_processes?: string;
    declared_special_nutrients?: string;
    serving_size_value?: number;
  };
  servingSize?: number;
  servingUnit?: string;
  density?: number;
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
  onConfirm,
  onCancel,
  dict
}: HFSInputModalProps) {
  const [scores, setScores] = useState(initialScores || {});
  const [formData, setFormData] = useState(initialFormData || {});
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());

  const t = dict?.hfsScores || {};
  const isV2 = version === 'v2';

  const conversionParams = {
    servingSize: servingSize || formData.serving_size_value,
    servingUnit: servingUnit || formData.serving_size_unit,
    density: density || formData.density,
  };

  useEffect(() => {
    if (!isOpen) return;
    
    if (isV2) {
      const nutrientFields = ['energy_kcal', 'carbs_total_g', 'protein_g', 'sodium_mg', 'fiber_g', 'saturated_fat_g', 'trans_fat_g'];
      const converted = convertNutrientsTo100g(initialFormData || {}, nutrientFields, conversionParams);
      setFormData({ ...initialFormData, ...converted });
    } else {
      const convertedScores: any = { ...initialScores };
      if (density !== undefined && density !== null) {
        convertedScores.density = convertedScores.density ?? density;
      } else {
        // Default density to 1.0 if not provided
        convertedScores.density = 1.0;
      }
      setScores(convertedScores);
    }
  }, [isOpen, initialScores, initialFormData, isV2, density, servingSize, servingUnit]);

  if (!isOpen) return null;

  // V1 fields (original)
  const v1Fields = [
    { key: 's1a', description: t.s1aDescription || 'Açúcares adicionados', unit: 'g', type: 'number' },
    { key: 's1b', description: t.s1bDescription || 'Açúcares naturais', unit: 'g', type: 'number' },
    { key: 's2', description: t.s2Description || 'Fibras', unit: 'g', type: 'number' },
    { key: 's3a', description: t.s3aDescription || 'Gordura Saturada', unit: 'g', type: 'number' },
    { key: 's3b', description: t.s3bDescription || 'Gordura Trans', unit: 'g', type: 'number' },
    { key: 's4', description: t.s4Description || 'Densidade calórica', unit: 'kcal', type: 'number' },
    { key: 's5', description: t.s5Description || 'Proteína', unit: 'g', type: 'number' },
    { key: 's6', description: t.s6Description || 'Sódio', unit: 'mg', type: 'number' },
    { key: 's7', description: t.s7Description || 'Grau de processamento (NOVA)', unit: '', type: 'number' },
    { key: 's8', description: t.s8Description || 'Aditivos artificiais', unit: '', type: 'number' },
    { key: 'density', description: t.densityDescription || 'Densidade', unit: 'g/ml', type: 'number' },
  ].map(field => ({
    ...field,
    label: field.key === 'density' 
      ? `${field.description}${field.unit ? ` (${field.unit})` : ''}`
      : `${field.key}: ${field.description}${field.unit ? ` (${field.unit})` : ''}`
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
    { key: 'declared_processes', description: t.v2DeclaredProcesses || 'Processos declarados', type: 'text' as const },
    { key: 'declared_special_nutrients', description: t.v2DeclaredSpecialNutrients || 'Nutrientes especiais declarados', type: 'text' as const },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  // Nutrient fields (after subtitle)
  const v2NutrientFields = [
    { key: 'energy_kcal', description: t.v2Energy || 'Energia', unit: 'kcal', type: 'number' as const },
    { key: 'carbs_total_g', description: t.v2CarbsTotal || 'Carboidratos totais', unit: 'g', type: 'number' as const },
    { key: 'protein_g', description: t.v2Protein || 'Proteínas', unit: 'g', type: 'number' as const },
    { key: 'sodium_mg', description: t.v2Sodium || 'Sódio', unit: 'mg', type: 'number' as const },
    { key: 'fiber_g', description: t.v2Fiber || 'Fibra alimentar', unit: 'g', type: 'number' as const },
    { key: 'saturated_fat_g', description: t.v2SaturatedFat || 'Gordura saturada', unit: 'g', type: 'number' as const },
    { key: 'trans_fat_g', description: t.v2TransFat || 'Gordura trans', unit: 'g', type: 'number' as const },
    { key: 'abv_percentage', description: t.v2ABV || 'ABV', unit: '%', type: 'number' as const },
  ].map(field => ({
    ...field,
    label: `${field.description}${field.unit ? ` (${field.unit})` : ''}`
  }));

  const fields = isV2 ? [...v2NutrientFields] : v1Fields;

  const handleChange = (key: string, value: string) => {
    if (isV2) {
      if (key === 'ingredients_list') {
        // Split by comma and trim
        const list = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({
          ...prev,
          [key]: list
        }));
      } else if (key === 'declared_processes' || key === 'declared_special_nutrients') {
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
      // For s7 (NOVA), parse as integer; for others, parse as float
      if (key === 's7') {
        const intValue = value === '' ? undefined : parseInt(value, 10);
        setScores(prev => ({
          ...prev,
          [key]: isNaN(intValue as number) ? undefined : intValue
        }));
      } else {
        const numValue = value === '' ? undefined : parseFloat(value);
        setScores(prev => ({
          ...prev,
          [key]: isNaN(numValue as number) ? undefined : numValue
        }));
      }
    }
  };

  const handleConfirm = () => {
    if (isV2) {
      const nutrientFields = ['energy_kcal', 'carbs_total_g', 'protein_g', 'sodium_mg', 'fiber_g', 'saturated_fat_g', 'trans_fat_g'];
      const converted = convertNutrientsFrom100g(formData, nutrientFields, conversionParams);
      const result = { ...formData, ...converted };
      result.abv_percentage = formData.abv_percentage ?? 0;
      onConfirm(result);
    } else {
      const scoreFields = ['s1a', 's1b', 's2', 's3a', 's3b', 's4', 's5', 's6', 's7', 's8'];
      const result: any = {};
      scoreFields.forEach(field => {
        const value = scores[field as keyof typeof scores];
        // For s7 (NOVA), ensure it's an integer if provided (including 0)
        if (field === 's7') {
          if (value !== undefined && value !== null) {
            result[field] = Math.round(value);
          } else {
            // If s7 is undefined/null, don't include it (or set to undefined)
            result[field] = undefined;
          }
        } else {
          // For other fields, use the value or 0 if undefined/null
          result[field] = value !== undefined && value !== null ? value : 0;
        }
      });
      const densityValue = scores.density ?? density ?? 1.0;
      result.density = densityValue || 1.0;
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
      // For v1, handle density specially
      if (key === 'density') {
        return density !== undefined && density !== null ? density : 1.0;
      }
      const value = scores[key as keyof typeof scores];
      return value !== undefined && value !== null ? value : '';
    }
  };

  // Check if a field value is null/undefined (presumed to be 0)
  const isPresumedZero = (key: string): boolean => {
    // Don't show as presumed zero if field is currently focused
    if (focusedFields.has(key)) return false;
    
    if (isV2) {
      if (key === 'ingredients_list') return false;
      const value = formData[key as keyof typeof formData];
      return value === undefined || value === null;
    } else {
      if (key === 'density') {
        // Density defaults to 1.0, so only show as zero if explicitly 0
        return density === 0;
      }
      const value = scores[key as keyof typeof scores];
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
              {/* Ingredients list field */}
              <div className="mb-3">
                <label className="text-xs font-medium text-text-main/80 mb-1 block">
                  {v2IngredientsField.label}
                </label>
                <textarea
                  value={getFieldValue('ingredients_list') as string}
                  onChange={(e) => handleChange('ingredients_list', e.target.value)}
                  placeholder="—"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Special fields: serving size, declared processes, declared special nutrients */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {v2SpecialFields.map(({ key, label, type }) => {
                  const rawValue = getFieldValue(key);
                  const isTextArea = type === 'text';
                  const isDeclaredField = key === 'declared_processes' || key === 'declared_special_nutrients';
                  const noneText = getNoneText(dict);
                  const isEmpty = !rawValue || rawValue === '';
                  const presumedZero = !isTextArea && isPresumedZero(key);
                  const isFocused = focusedFields.has(key);
                  const displayValue = isTextArea 
                    ? (isDeclaredField && isEmpty ? '' : String(rawValue || ''))
                    : (presumedZero && !isFocused ? '' : String(rawValue || ''));
                  
                  // Get default value configuration
                  const defaultConfig = getDefaultValueConfig({
                    value: rawValue,
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
                          type={type}
                          step={key === 'serving_size_value' ? '1' : '0.1'}
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
                  const value = getFieldValue(key);
                  const presumedZero = isPresumedZero(key);
                  const isFocused = focusedFields.has(key);
                  const displayValue = presumedZero && !isFocused ? '' : String(value || '');
                  
                  // Get default value configuration
                  const defaultConfig = getDefaultValueConfig({
                    value,
                    placeholder: presumedZero ? '0' : undefined,
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
                        step={key === 'abv_percentage' ? '1' : '0.1'}
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
            </>
          ) : (
            <>
              <h4 className="text-xs font-bold text-text-main/60 mb-2 uppercase">
                {t.parametersSubtitle || 'Dados'}
                <span className="normal-case font-normal text-text-main/50 ml-2">
                  (para a porção padrão de 100g)
                </span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {fields.map(({ key, label, type }) => {
              const rawValue = getFieldValue(key);
              const isS8 = key === 's8';
              const isTextArea = type === 'text' && (key === 'ingredients_list' || key === 'declared_processes' || key === 'declared_special_nutrients');
              const isDeclaredField = key === 'declared_processes' || key === 'declared_special_nutrients';
              const noneText = getNoneText(dict);
              const isEmpty = !rawValue || rawValue === '';
              const showNone = isS8 && isEmpty;
              const presumedZero = isPresumedZero(key) && !isS8;
              const isFocused = focusedFields.has(key);
              
              // Determine placeholder
              let placeholder: string | undefined = undefined;
              if (isS8 && showNone) {
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
              const defaultConfig = getDefaultValueConfig({
                value: isDeclaredField && isEmpty ? '' : rawValue,
                placeholder,
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
                      placeholder={defaultConfig.placeholder || '—'}
                      rows={key === 'ingredients_list' ? 3 : 2}
                      className={`w-full px-3 py-2 bg-background border border-text-main/20 rounded-theme text-sm text-text-main focus:outline-none focus:border-primary resize-none ${getPlaceholderClasses(defaultConfig.showItalic)}`}
                    />
                  ) : (
                    <input
                      type={type}
                      step={key === 's7' || key === 's8' || key === 'abv_percentage' || key === 'density' ? '1' : '0.1'}
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
            className="px-4 py-1.5 rounded-theme font-bold text-sm text-white bg-primary hover:opacity-90 transition shadow-lg"
          >
            {t.confirm || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

