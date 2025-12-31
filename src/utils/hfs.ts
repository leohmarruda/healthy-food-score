import { FoodFormData } from '@/types/food';

interface CheckHFSInputResponse {
  success: boolean;
  warnings?: string[];
}

export function checkHFSInput(formData: FoodFormData, version: string = 'v2', dict?: any): CheckHFSInputResponse {
  const t = dict?.hfs || {};
  let success = true;
  let warnings: string[] = [];
  
  if (!formData.ingredient_list?.length) 
  {
    success = false;
    warnings.push(t.noIngredients || "No ingredients provided.");
  }
  if (!formData.energy_kcal) 
  {
    success = false;
    warnings.push(t.noCalories || "Calories data not provided.");
  }
  return { 
    success: success,
    warnings: warnings
  };
}

interface HFSResponse {
    success: boolean;
    hfs_score: number;
    hfs_version: string;
    confidence: number;
    reasoning?: string;
    error?: string;
  }

export async function calculateHFS(formData: FoodFormData, version: string = 'v2', dict?: any): Promise<HFSResponse> {
  // Bypass API call - return default score
  // TODO: Re-enable API call when ready
  // Version parameter will be used when API is re-enabled
  const t = dict?.hfs || {};
  const error_msg = formData.ingredient_list?.join(', ') || (t.noIngredientsError || 'No ingredients');
  return { 
    success: true,
    hfs_score: -1,
    hfs_version: version,
    confidence: 1,
    error: error_msg
  };

  // Original API call code (commented out):
  /*
  try {
    // Call API route that processes AI (e.g., OpenAI or Gemini)
    const response = await fetch('/api/hfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: formData.ingredients_list,
        nutrients: {
          energy: formData.energy_kcal,
          protein: formData.protein_g,
          carbs: formData.carbs_total_g,
          fat: formData.fat_total_g,
          sodium: formData.sodium_mg,
          fiber: formData.fiber_g,
        }
      }),
    });

    if (!response.ok) throw new Error("AI response error");

    const { temp_hfs_score } = await response.json();

    // Return updated data with new HFS score
    return { 
        success: true,
        hfs_score: temp_hfs_score,
        confidence: 1 
    };
  } catch (error) {
    console.error("Failed to calculate HFS via AI, setting to -1:", error);
    // On AI error, return -1 as fallback
    return { 
        success: false,
        hfs_score: -1,
        confidence: 1 
    };
  }
  */
}