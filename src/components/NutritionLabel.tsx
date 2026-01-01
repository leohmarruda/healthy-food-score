'use client';
import { useParams } from 'next/navigation';
import type { Food, FoodFormData } from '@/types/food';

interface NutritionLabelProps {
  data: Food | FoodFormData;
  usePortion?: boolean;
  multiplier?: number;
  onMultiplierChange?: (newMultiplier: number) => void;
  dict: any;
}

export default function NutritionLabel({ 
  data, 
  usePortion = true, 
  multiplier = 1,
  onMultiplierChange,
  dict
}: NutritionLabelProps) {
  if (!data || !dict) return null;

  const params = useParams();
  const lang = (params?.lang as string) || 'pt';
  const isPortuguese = lang === 'pt';
  
  const t = dict?.components?.nutritionLabel || {};

  // Extract nutrition_parsed data with fallback to flat fields
  const nutritionParsed = data.nutrition_parsed || {};
  const metadata = nutritionParsed.metadata || {};
  const carbs = nutritionParsed.carbohydrates || {};
  const proteins = nutritionParsed.proteins || {};
  const fats = nutritionParsed.fats || {};
  const fiber = nutritionParsed.fiber || {};
  const minerals = nutritionParsed.minerals_mg || {};
  const vitamins = nutritionParsed.vitamins || {};

  // Calculate nutrition values based on portion size and multiplier
  const servingSize = metadata.serving_size || data.serving_size_value || 100;
  const servingUnit = metadata.serving_size_unit || data.serving_size_unit || 'g';
  const baseRatio = usePortion ? (servingSize / 100) : 1;
  const totalRatio = baseRatio * multiplier;

  // Helper functions to format nutrition values
  const formatValue = (num: number | null | undefined) => {
    if (num == null || num === 0) return "0";
    return (num * totalRatio).toFixed(1);
  };
  
  const formatCalories = (num: number | null | undefined) => {
    if (num == null) return 0;
    return Math.round(num * totalRatio);
  };
  
  const calculatePercentage = (value: number | null | undefined, dailyValue: number) => {
    if (value == null) return 0;
    return Math.round(((value * totalRatio) / dailyValue) * 100);
  };

  // Get values with fallback: nutrition_parsed -> flat fields
  const energyKcal = nutritionParsed.energy_kcal ?? data.energy_kcal ?? 0;
  const totalFat = fats.total_fats_g ?? data.fat_total_g ?? 0;
  const saturatedFat = fats.saturated_fats_g ?? data.saturated_fat_g ?? 0;
  const transFat = fats.trans_fats_g ?? data.trans_fat_g ?? 0;
  const monounsaturatedFat = fats.monounsaturated_fats_g;
  const polyunsaturatedFat = fats.polyunsaturated_fats_g;
  const cholesterol = fats.cholesterol_mg;
  const sodium = minerals.sodium_mg ?? data.sodium_mg ?? 0;
  const totalCarbs = carbs.total_carbs_g ?? data.carbs_total_g ?? 0;
  const sugarsTotal = carbs.sugars_total_g;
  const sugarsAdded = carbs.sugars_added_g;
  const polyols = carbs.polyols_g;
  const starch = carbs.starch_g;
  const totalFiber = fiber.total_fiber_g ?? data.fiber_g ?? 0;
  const solubleFiber = fiber.soluble_fiber_g;
  const insolubleFiber = fiber.insoluble_fiber_g;
  const protein = proteins.total_proteins_g ?? data.protein_g ?? 0;
  
  // Important minerals
  const calcium = minerals.calcium_mg;
  const iron = minerals.iron_mg;
  const potassium = minerals.potassium_mg;
  const magnesium = minerals.magnesium_mg;
  const zinc = minerals.zinc_mg;
  
  // Important vitamins
  const vitaminA = vitamins.vitamin_a_mcg;
  const vitaminC = vitamins.vitamin_c_mg;
  const vitaminD = vitamins.vitamin_d_mcg;
  const vitaminE = vitamins.vitamin_e_mg;
  const vitaminK = vitamins.vitamin_k_mcg;
  const vitaminB12 = vitamins.vitamin_b12_mcg;
  const vitaminB6 = vitamins.vitamin_b6_mg;
  const vitaminB9 = vitamins.vitamin_b9_mcg;

  // Render a nutrition field row
  const renderField = (
    label: string,
    value: number | null | undefined,
    unit: string,
    isBold: boolean = false,
    indent: number = 0,
    dailyValue?: number,
    formatFn: (val: number | null | undefined) => string = formatValue
  ) => {
    if (value == null || value === 0) return null;
    const formattedValue = formatFn(value);
    const percentage = dailyValue ? calculatePercentage(value, dailyValue) : null;
    const indentClass = indent === 0 ? '' : indent === 1 ? 'pl-4' : indent === 2 ? 'pl-6' : '';
    const textSizeClass = indent === 0 ? 'text-sm' : indent === 1 ? 'text-sm' : 'text-xs';
    
    return (
      <div className={`border-b border-black py-1 ${indentClass} flex justify-between ${textSizeClass}`}>
        <span>
          {isBold ? <span className="font-bold">{label}</span> : label} {formattedValue}{unit}
        </span>
        <span className="font-bold">{percentage !== null ? `${percentage}%` : ''}</span>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 border-2 border-black max-w-[300px] font-sans text-black shadow-md">
      <h2 className="text-3xl font-black leading-tight border-b-8 border-black">
        {t.factsTitle || 'Nutrition Facts'}
      </h2>
      <div className="border-b-4 border-black py-1 font-bold flex justify-between items-center">
        <span>{t.servingSize || 'Serving size'}</span>
        <span className="flex items-center gap-1">
          {usePortion 
            ? `${Math.round(servingSize * multiplier)}${servingUnit}` 
            : '100g'
          }
          {onMultiplierChange && (
            <div className="flex flex-col gap-0.5 ml-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMultiplierChange(multiplier + 0.5);
                }}
                className="w-3 h-2.5 flex items-center justify-center bg-white border border-black hover:bg-gray-100 active:bg-gray-200 transition text-[7px] font-bold leading-none shadow-sm"
                title="Increase servings"
              >
                ▲
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMultiplierChange(Math.max(0.5, multiplier - 0.5));
                }}
                className="w-3 h-2.5 flex items-center justify-center bg-white border border-black hover:bg-gray-100 active:bg-gray-200 transition text-[7px] font-bold leading-none shadow-sm"
                title="Decrease servings"
              >
                ▼
              </button>
            </div>
          )}
        </span>
      </div>
      
      {/* Energy - Show kcal and kJ for Portuguese (ANVISA), only kcal for English (FDA) */}
      <div className="border-b-8 border-black py-1 flex justify-between items-center">
        <span className="font-bold">{t.calories || 'Calories'}</span>
        <span className="font-bold">
          {isPortuguese ? (
            <>
              {formatCalories(energyKcal)} kcal ({Math.round(energyKcal * totalRatio * 4.184)} kJ)
            </>
          ) : (
            formatCalories(energyKcal)
          )}
        </span>
      </div>
  
      <div className="text-sm border-b border-black py-1 text-right font-bold">
        % {t.dailyValue || 'Daily Value'}*
      </div>

      {isPortuguese ? (
        // ANVISA Order (Brazil)
        <>
          {/* 1. Carboidratos */}
          {totalCarbs > 0 && renderField(t.carbs || 'Carboidratos Totais', totalCarbs, 'g', true, 0, 275)}
          
          {/* 2. Açúcares totais */}
          {sugarsTotal != null && sugarsTotal > 0 && renderField(t.sugarsTotal || 'Açúcares Totais', sugarsTotal, 'g', false, 1)}
          
          {/* 3. Açúcares adicionados */}
          {sugarsAdded != null && sugarsAdded > 0 && renderField(`${t.includes || 'Inclui'} ${formatValue(sugarsAdded)}g ${t.sugarsAdded || 'Açúcares Adicionados'}`, sugarsAdded, '', false, 1, 50)}
          
          {/* 4. Proteínas */}
          {protein > 0 && (
            <div className="border-b-4 border-black py-1 flex justify-between">
              <span><span className="font-bold">{t.protein || 'Proteínas'}</span> {formatValue(protein)}g</span>
              <span></span>
            </div>
          )}
          
          {/* 5. Gorduras Totais */}
          {totalFat > 0 && renderField(t.fat || 'Gorduras Totais', totalFat, 'g', true, 0, 78)}
          
          {/* 6. Gorduras Saturadas */}
          {saturatedFat > 0 && renderField(t.saturatedFat || 'Gorduras Saturadas', saturatedFat, 'g', false, 1, 20)}
          
          {/* 7. Gorduras Trans */}
          {transFat > 0 && renderField(t.transFat || 'Gorduras Trans', transFat, 'g', false, 1)}
          
          {/* 8. Fibra Alimentar */}
          {totalFiber > 0 && renderField(t.fiber || 'Fibra Alimentar', totalFiber, 'g', false, 0, 28)}
          
          {/* 9. Sódio */}
          {sodium > 0 && renderField(t.sodium || 'Sódio', sodium, 'mg', true, 0, 2300, (val) => Math.round((val || 0) * totalRatio).toString())}
          
          {/* 10. Vitaminas e Minerais (opcional, apenas se presentes) */}
          {(calcium != null || iron != null || potassium != null || magnesium != null || zinc != null || 
            vitaminA != null || vitaminC != null || vitaminD != null || vitaminE != null || vitaminK != null || 
            vitaminB12 != null || vitaminB6 != null || vitaminB9 != null) && (
            <>
              {calcium != null && calcium > 0 && renderField(t.calcium || 'Cálcio', calcium, 'mg', false, 0, 1300, (val) => Math.round((val || 0) * totalRatio).toString())}
              {iron != null && iron > 0 && renderField(t.iron || 'Ferro', iron, 'mg', false, 0, 18)}
              {potassium != null && potassium > 0 && renderField(t.potassium || 'Potássio', potassium, 'mg', false, 0, 4700, (val) => Math.round((val || 0) * totalRatio).toString())}
              {magnesium != null && magnesium > 0 && renderField(t.magnesium || 'Magnésio', magnesium, 'mg', false, 0, 420)}
              {zinc != null && zinc > 0 && renderField(t.zinc || 'Zinco', zinc, 'mg', false, 0, 11)}
              {vitaminA != null && vitaminA > 0 && renderField(t.vitaminA || 'Vitamina A', vitaminA, 'mcg', false, 0, 900, (val) => Math.round((val || 0) * totalRatio).toString())}
              {vitaminC != null && vitaminC > 0 && renderField(t.vitaminC || 'Vitamina C', vitaminC, 'mg', false, 0, 90)}
              {vitaminD != null && vitaminD > 0 && renderField(t.vitaminD || 'Vitamina D', vitaminD, 'mcg', false, 0, 20, (val) => Math.round((val || 0) * totalRatio).toString())}
              {vitaminE != null && vitaminE > 0 && renderField(t.vitaminE || 'Vitamina E', vitaminE, 'mg', false, 0, 15)}
              {vitaminK != null && vitaminK > 0 && renderField(t.vitaminK || 'Vitamina K', vitaminK, 'mcg', false, 0, 120, (val) => Math.round((val || 0) * totalRatio).toString())}
              {vitaminB12 != null && vitaminB12 > 0 && renderField(t.vitaminB12 || 'Vitamina B12', vitaminB12, 'mcg', false, 0, 2.4, (val) => Math.round((val || 0) * totalRatio).toString())}
              {vitaminB6 != null && vitaminB6 > 0 && renderField(t.vitaminB6 || 'Vitamina B6', vitaminB6, 'mg', false, 0, 1.7)}
              {vitaminB9 != null && vitaminB9 > 0 && renderField(t.vitaminB9 || 'Ácido Fólico (B9)', vitaminB9, 'mcg', false, 0, 400, (val) => Math.round((val || 0) * totalRatio).toString())}
            </>
          )}
        </>
      ) : (
        // FDA Order (USA)
        <>
          {/* Fats Section */}
          {totalFat > 0 && renderField(t.fat || 'Total Fat', totalFat, 'g', true, 0, 78)}
          {saturatedFat > 0 && renderField(t.saturatedFat || 'Saturated Fat', saturatedFat, 'g', false, 1, 20)}
          {transFat > 0 && renderField(t.transFat || 'Trans Fat', transFat, 'g', false, 1)}
          {monounsaturatedFat != null && monounsaturatedFat > 0 && renderField(t.monounsaturatedFat || 'Monounsaturated Fat', monounsaturatedFat, 'g', false, 1)}
          {polyunsaturatedFat != null && polyunsaturatedFat > 0 && renderField(t.polyunsaturatedFat || 'Polyunsaturated Fat', polyunsaturatedFat, 'g', false, 1)}
          {cholesterol != null && cholesterol > 0 && renderField(t.cholesterol || 'Cholesterol', cholesterol, 'mg', false, 1, 300, (val) => Math.round((val || 0) * totalRatio).toString())}
          
          {/* Sodium */}
          {sodium > 0 && renderField(t.sodium || 'Sodium', sodium, 'mg', true, 0, 2300, (val) => Math.round((val || 0) * totalRatio).toString())}
          
          {/* Carbohydrates Section */}
          {totalCarbs > 0 && renderField(t.carbs || 'Total Carbohydrate', totalCarbs, 'g', true, 0, 275)}
          {totalFiber > 0 && renderField(t.fiber || 'Dietary Fiber', totalFiber, 'g', false, 1, 28)}
          {solubleFiber != null && solubleFiber > 0 && renderField(t.solubleFiber || 'Soluble Fiber', solubleFiber, 'g', false, 2)}
          {insolubleFiber != null && insolubleFiber > 0 && renderField(t.insolubleFiber || 'Insoluble Fiber', insolubleFiber, 'g', false, 2)}
          {sugarsTotal != null && sugarsTotal > 0 && renderField(t.sugarsTotal || 'Total Sugars', sugarsTotal, 'g', false, 1)}
          {sugarsAdded != null && sugarsAdded > 0 && renderField(`${t.includes || 'Includes'} ${formatValue(sugarsAdded)}g ${t.sugarsAdded || 'Added Sugars'}`, sugarsAdded, '', false, 2, 50)}
          {polyols != null && polyols > 0 && renderField(t.polyols || 'Polyols', polyols, 'g', false, 1)}
          {starch != null && starch > 0 && renderField(t.starch || 'Starch', starch, 'g', false, 1)}
          
          {/* Protein */}
          {protein > 0 && (
            <div className="border-b-4 border-black py-1 flex justify-between">
              <span><span className="font-bold">{t.protein || 'Protein'}</span> {formatValue(protein)}g</span>
              <span></span>
            </div>
          )}
          
          {/* Minerals Section */}
          {calcium != null && calcium > 0 && renderField(t.calcium || 'Calcium', calcium, 'mg', false, 0, 1300, (val) => Math.round((val || 0) * totalRatio).toString())}
          {iron != null && iron > 0 && renderField(t.iron || 'Iron', iron, 'mg', false, 0, 18)}
          {potassium != null && potassium > 0 && renderField(t.potassium || 'Potassium', potassium, 'mg', false, 0, 4700, (val) => Math.round((val || 0) * totalRatio).toString())}
          {magnesium != null && magnesium > 0 && renderField(t.magnesium || 'Magnesium', magnesium, 'mg', false, 0, 420)}
          {zinc != null && zinc > 0 && renderField(t.zinc || 'Zinc', zinc, 'mg', false, 0, 11)}
          
          {/* Vitamins Section */}
          {vitaminA != null && vitaminA > 0 && renderField(t.vitaminA || 'Vitamin A', vitaminA, 'mcg', false, 0, 900, (val) => Math.round((val || 0) * totalRatio).toString())}
          {vitaminC != null && vitaminC > 0 && renderField(t.vitaminC || 'Vitamin C', vitaminC, 'mg', false, 0, 90)}
          {vitaminD != null && vitaminD > 0 && renderField(t.vitaminD || 'Vitamin D', vitaminD, 'mcg', false, 0, 20, (val) => Math.round((val || 0) * totalRatio).toString())}
          {vitaminE != null && vitaminE > 0 && renderField(t.vitaminE || 'Vitamin E', vitaminE, 'mg', false, 0, 15)}
          {vitaminK != null && vitaminK > 0 && renderField(t.vitaminK || 'Vitamin K', vitaminK, 'mcg', false, 0, 120, (val) => Math.round((val || 0) * totalRatio).toString())}
          {vitaminB12 != null && vitaminB12 > 0 && renderField(t.vitaminB12 || 'Vitamin B12', vitaminB12, 'mcg', false, 0, 2.4, (val) => Math.round((val || 0) * totalRatio).toString())}
          {vitaminB6 != null && vitaminB6 > 0 && renderField(t.vitaminB6 || 'Vitamin B6', vitaminB6, 'mg', false, 0, 1.7)}
          {vitaminB9 != null && vitaminB9 > 0 && renderField(t.vitaminB9 || 'Folate (B9)', vitaminB9, 'mcg', false, 0, 400, (val) => Math.round((val || 0) * totalRatio).toString())}
        </>
      )}

      <p className="text-[10px] leading-tight mt-2 italic">
        {t.footnote?.replace('{size}', usePortion ? `${servingSize}${servingUnit}` : '100g') || 
        `* Based on a serving size. 2,000 calories a day is used for general nutrition advice.`}
      </p>
    </div>
  );
}
