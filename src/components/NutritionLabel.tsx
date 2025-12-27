'use client';
import type { Food, FoodFormData } from '@/types/food';

interface NutritionLabelProps {
  data: Food | FoodFormData;
  usePortion?: boolean;
  multiplier?: number;
  onMultiplierChange?: (newMultiplier: number) => void;
  dict: any; // Adicionado
}

export default function NutritionLabel({ 
  data, 
  usePortion = true, 
  multiplier = 1,
  onMultiplierChange,
  dict
}: NutritionLabelProps) {
  if (!data || !dict) return null;

  const t = dict.nutrition || {}; // Usaremos uma seção nova no JSON

  // Calculate nutrition values based on portion size and multiplier
  const baseRatio = usePortion ? ((data.portion_size_value || 100) / 100) : 1;
  const totalRatio = baseRatio * multiplier;

  // Helper functions to format nutrition values
  const formatValue = (num: number | undefined) => {
    if (!num) return "0";
    return (num * totalRatio).toFixed(1);
  };
  
  const formatCalories = (num: number | undefined) => {
    if (!num) return 0;
    return Math.round(num * totalRatio);
  };
  
  const calculatePercentage = (value: number | undefined, dailyValue: number) => {
    if (!value) return 0;
    return Math.round(((value * totalRatio) / dailyValue) * 100);
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
            ? `${Math.round((data.portion_size_value || 100) * multiplier)}${data.portion_unit || 'g'}` 
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
      
      <div className="border-b-8 border-black py-1 flex justify-between items-end">
        <span className="text-2xl font-black">{t.calories || 'Calories'}</span>
        <span className="text-4xl font-black">{formatCalories(data.energy_kcal)}</span>
      </div>
  
      <div className="text-sm border-b border-black py-1 text-right font-bold">
        % {t.dailyValue || 'Daily Value'}*
      </div>
  
      <div className="border-b border-black py-1 flex justify-between">
        <span><span className="font-bold">{t.fat || 'Total Fat'}</span> {formatValue(data.fat_total_g)}g</span>
        <span className="font-bold">{calculatePercentage(data.fat_total_g, 78)}%</span>
      </div>

      <div className="border-b border-black py-1 pl-4 flex justify-between text-sm">
        <span>{t.saturatedFat || 'Saturated Fat'} {formatValue(data.saturated_fat_g)}g</span>
        <span className="font-bold">{calculatePercentage(data.saturated_fat_g, 20)}%</span>
      </div>

      <div className="border-b border-black py-1 flex justify-between">
        <span>
          <span className="font-bold">{t.sodium || 'Sodium'}</span> {Math.round((data.sodium_mg || 0) * totalRatio)}mg
        </span>
        <span className="font-bold">{calculatePercentage(data.sodium_mg, 2300)}%</span>
      </div>

      <div className="border-b border-black py-1 flex justify-between">
        <span><span className="font-bold">{t.carbs || 'Total Carbohydrate'}</span> {formatValue(data.carbs_total_g)}g</span>
        <span className="font-bold">{calculatePercentage(data.carbs_total_g, 275)}%</span>
      </div>

      <div className="border-b border-black py-1 pl-4 flex justify-between text-sm">
        <span>{t.fiber || 'Dietary Fiber'} {formatValue(data.fiber_g)}g</span>
        <span className="font-bold">{calculatePercentage(data.fiber_g, 28)}%</span>
      </div>

      <div className="border-b-4 border-black py-1 flex justify-between">
        <span><span className="font-bold">{t.protein || 'Protein'}</span> {formatValue(data.protein_g)}g</span>
        <span></span>
      </div>

      <p className="text-[10px] leading-tight mt-2 italic">
        {t.footnote?.replace('{size}', usePortion ? `${data.portion_size_value}${data.portion_unit}` : '100g') || 
        `* Based on a serving size. 2,000 calories a day is used for general nutrition advice.`}
      </p>
    </div>
  );
}