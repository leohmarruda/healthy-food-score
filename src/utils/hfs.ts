import { FoodFormData } from '@/types/food';

interface CheckHFSInputResponse {
  success: boolean;
  warnings?: string[];
}

export function checkHFSInput(formData: FoodFormData, version: string = 'v2', dict?: any): CheckHFSInputResponse {
  const t = dict?.hfs || {};
  let success = true;
  let warnings: string[] = [];
  
  // Check if ingredients_list exists and has items
  const hasIngredients = Array.isArray(formData.ingredients_list) && formData.ingredients_list.length > 0;
  const hasIngredientsRaw = formData.ingredients_raw && formData.ingredients_raw.trim().length > 0;
  
  if (!hasIngredients && !hasIngredientsRaw) {
    success = false;
    warnings.push(t.noIngredients || "No ingredients provided.");
  }
  
  if (!formData.energy_kcal) {
    success = false;
    warnings.push(t.noCalories || "Calories data not provided.");
  }
  
  // NOVA is only required for v1
  if (version === 'v1' && !formData.NOVA) {
    success = false;
    warnings.push(t.noNOVA || "NOVA data not provided.");
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
  }

/**
 * Counts unique additives detected in ingredients list using regex patterns from additive_rules
 * Each ingredient is checked individually against all regex patterns
 * @param ingredientsList Array of ingredient strings
 * @returns Number of unique additives detected (without double counting)
 */
async function countAdditives(ingredientsList: string[]): Promise<number> {
  if (!Array.isArray(ingredientsList) || ingredientsList.length === 0) {
    return 0;
  }

  try {
    // Fetch additive rules from API
    const response = await fetch('/api/additives');
    if (!response.ok) {
      console.error('Failed to fetch additive rules');
      return 0;
    }
    
    const additiveRules = await response.json();
    if (!Array.isArray(additiveRules) || additiveRules.length === 0) {
      return 0;
    }

    // Set to track unique additives detected (by name)
    const detectedAdditives = new Set<string>();
    
    // Check each ingredient against all additive rules
    for (const ingredient of ingredientsList) {
      if (!ingredient || typeof ingredient !== 'string') continue;
      
      const ingredientLower = ingredient.toLowerCase().trim();
      
      // Check each additive rule against this ingredient
      for (const rule of additiveRules) {
        if (!rule.regex || !rule.name) continue;
        
        // Skip if this additive was already detected (avoid double counting)
        if (detectedAdditives.has(rule.name)) continue;
        
        try {
          // Remove inline flags like (?i) from regex (JavaScript doesn't support them)
          // We already pass 'i' flag to RegExp constructor
          let cleanedRegex = rule.regex;
          cleanedRegex = cleanedRegex.replace(/\(\?[imsux]*\)/g, '');
          
          // Create regex pattern (case-insensitive)
          const regex = new RegExp(cleanedRegex, 'i');
          
          // Check if regex matches this ingredient
          if (regex.test(ingredientLower)) {
            detectedAdditives.add(rule.name);
            // Continue checking other rules - one ingredient can contain multiple additives
          }
        } catch (e) {
          // Skip invalid regex patterns
          console.warn(`Invalid regex pattern for additive ${rule.name}:`, rule.regex, e);
        }
      }
    }
    
    return detectedAdditives.size;
  } catch (error) {
    console.error('Error counting additives:', error);
    return 0;
  }
}

// Prepare initial scores for modal (without calculating final HFS)
export async function prepareInitialScores(formData: FoodFormData, version: string = 'v1'): Promise<{
  scores?: any;
  servingSize?: number;
  servingUnit?: string;
  density?: number;
}> {
  // Only prepare scores for v1
  if (version !== 'v1') {
    return {};
  }

  // Calculate conversion factor: 100g / serving_size_value
  // If unit is ml, first convert ml to g using density
  const servingSizeValue = formData.serving_size_value || 100;
  const servingSizeUnit = formData.serving_size_unit || 'g';
  const densityValue = formData.density || 1;
  
  // If unit is ml, convert ml to g using density
  let servingSizeInGrams = servingSizeValue;
  if (servingSizeUnit.toLowerCase() === 'ml' && densityValue > 0) {
    servingSizeInGrams = servingSizeValue * densityValue;
  }
  
  // Then convert from serving to 100g
  const conversionFactor = (servingSizeInGrams > 0) 
    ? 100 / servingSizeInGrams 
    : 1;
  
  // Extract nutrition data from nutrition_parsed if available
  const nutritionParsed = formData.nutrition_parsed || {};
  const carbs = nutritionParsed.carbohydrates || {};
  const fats = nutritionParsed.fats || {};
  const minerals = nutritionParsed.minerals_mg || {};
  
  // Values per 100g (multiply by conversionFactor)
  // Use nutrition_parsed values if available, otherwise use formData values
  // Round to 2 decimal places for all conversions
  const sugarsTotalPer100g = Math.round(((carbs.sugars_total_g || 0) * conversionFactor) * 100) / 100;
  const sugarsAddedPer100g = Math.round(((carbs.sugars_added_g || 0) * conversionFactor) * 100) / 100;
  // Natural = Total - Added, but ensure it's never negative
  const sugarsNaturalPer100g = Math.max(0, Math.round((sugarsTotalPer100g - sugarsAddedPer100g) * 100) / 100);
  const fiberPer100g = Math.round(((formData.fiber_g || 0) * conversionFactor) * 100) / 100;
  const saturatedFatPer100g = Math.round(((fats.saturated_fats_g || formData.saturated_fat_g || 0) * conversionFactor) * 100) / 100;
  const transFatPer100g = Math.round(((fats.trans_fats_g || formData.trans_fat_g || 0) * conversionFactor) * 100) / 100;
  const energyPer100g = Math.round(((formData.energy_kcal || 0) * conversionFactor) * 100) / 100;
  const proteinPer100g = Math.round(((formData.protein_g || 0) * conversionFactor) * 100) / 100;
  const sodiumPer100g = Math.round(((minerals.sodium_mg || formData.sodium_mg || 0) * conversionFactor) * 100) / 100;
  
  // Calculate S8: Count unique additives detected by regex patterns
  const s8Additives = Array.isArray(formData.ingredients_list) && formData.ingredients_list.length > 0
    ? await countAdditives(formData.ingredients_list)
    : 0;
  
  // Return raw values per 100g without any transformation (no HFS calculation)
  const scores = {
    s1a: sugarsAddedPer100g > 0 ? sugarsAddedPer100g : undefined, // Açúcares adicionados (g)
    s1b: sugarsNaturalPer100g > 0 ? sugarsNaturalPer100g : undefined, // Açúcares naturais (g)
    s2: fiberPer100g > 0 ? fiberPer100g : undefined, // Fibras (g)
    s3a: saturatedFatPer100g > 0 ? saturatedFatPer100g : undefined, // Gordura Saturada (g)
    s3b: transFatPer100g > 0 ? transFatPer100g : undefined, // Gordura Trans (g)
    s4: energyPer100g > 0 ? energyPer100g : undefined, // Densidade calórica (kcal)
    s5: proteinPer100g > 0 ? proteinPer100g : undefined, // Proteína (g)
    s6: sodiumPer100g > 0 ? sodiumPer100g : undefined, // Sódio (mg)
    s7: formData.NOVA ? Math.round(formData.NOVA) : undefined, // Grau de processamento (NOVA) - sempre inteiro
    s8: s8Additives > 0 ? s8Additives : undefined, // Aditivos artificiais (lista)
    density: formData.density,
  };

  return {
    scores,
    servingSize: servingSizeValue,
    servingUnit: servingSizeUnit,
    density: formData.density,
  };
}

export async function calculateHFS(formData: FoodFormData, version: string = 'v2', dict?: any): Promise<HFSResponse> {
  // Bypass API call - return default score
  // TODO: Re-enable API call when ready
  // Version parameter will be used when API is re-enabled
  const t = dict?.hfs || {};
  
  // Calculate conversion factor: 100g / serving_size_value
  // If unit is ml, first convert ml to g using density
  const servingSizeValue = formData.serving_size_value || 100;
  const servingSizeUnit = formData.serving_size_unit || 'g';
  const densityValue = formData.density || 1;
  
  // If unit is ml, convert ml to g using density
  let servingSizeInGrams = servingSizeValue;
  if (servingSizeUnit.toLowerCase() === 'ml' && densityValue > 0) {
    servingSizeInGrams = servingSizeValue * densityValue;
  }
  
  // Then convert from serving to 100g
  const conversionFactor = (servingSizeInGrams > 0) 
    ? 100 / servingSizeInGrams 
    : 1;
  
  // Calculate mock scores for now (will be replaced by API response)
  // Extract nutrition data from nutrition_parsed if available
  const nutritionParsed = formData.nutrition_parsed || {};
  const carbs = nutritionParsed.carbohydrates || {};
  const fats = nutritionParsed.fats || {};
  const minerals = nutritionParsed.minerals_mg || {};
  
  // Values per 100g (multiply by conversionFactor)
  // Use nutrition_parsed values if available, otherwise use formData values
  const sugarsTotalPer100g = (carbs.sugars_total_g || 0) * conversionFactor;
  const sugarsAddedPer100g = (carbs.sugars_added_g || 0) * conversionFactor;
  // Natural = Total - Added, but ensure it's never negative
  const sugarsNaturalPer100g = Math.max(0, sugarsTotalPer100g - sugarsAddedPer100g);
  const fiberPer100g = (formData.fiber_g || 0) * conversionFactor;
  const saturatedFatPer100g = (fats.saturated_fats_g || formData.saturated_fat_g || 0) * conversionFactor;
  const transFatPer100g = (fats.trans_fats_g || formData.trans_fat_g || 0) * conversionFactor;
  const energyPer100g = (formData.energy_kcal || 0) * conversionFactor;
  const proteinPer100g = (formData.protein_g || 0) * conversionFactor;
  const sodiumPer100g = (minerals.sodium_mg || formData.sodium_mg || 0) * conversionFactor;
  
  // Calculate S8: Count unique additives detected by regex patterns
  const s8Additives = Array.isArray(formData.ingredients_list) && formData.ingredients_list.length > 0
    ? await countAdditives(formData.ingredients_list)
    : 0;
  
  // Mock scores calculation (placeholder until API is ready)
  // Return raw values per 100g without any transformation
  const scores = {
    s1a: sugarsAddedPer100g > 0 ? sugarsAddedPer100g : undefined, // Açúcares adicionados (g)
    s1b: sugarsNaturalPer100g > 0 ? sugarsNaturalPer100g : undefined, // Açúcares naturais (g)
    s2: fiberPer100g > 0 ? fiberPer100g : undefined, // Fibras (g)
    s3a: saturatedFatPer100g > 0 ? saturatedFatPer100g : undefined, // Gordura Saturada (g)
    s3b: transFatPer100g > 0 ? transFatPer100g : undefined, // Gordura Trans (g)
    s4: energyPer100g > 0 ? energyPer100g : undefined, // Densidade calórica (kcal)
    s5: proteinPer100g > 0 ? proteinPer100g : undefined, // Proteína (g)
    s6: sodiumPer100g > 0 ? sodiumPer100g : undefined, // Sódio (mg)
    s7: formData.NOVA ? Math.round(formData.NOVA) : undefined, // Grau de processamento (NOVA) - sempre inteiro
    s8: s8Additives > 0 ? s8Additives : undefined, // Aditivos artificiais (lista)
  };
  
  // Calculate HFSv1 if version is v1
  let hfsScore = -1;
  if (version === 'v1') {
    const { calculateHFSScores } = await import('@/utils/hfs-calculations');
    const calculatedScores = calculateHFSScores({
      s1a: typeof scores.s1a === 'number' ? scores.s1a : 0,
      s1b: typeof scores.s1b === 'number' ? scores.s1b : 0,
      s2: typeof scores.s2 === 'number' ? scores.s2 : 0,
      s3a: typeof scores.s3a === 'number' ? scores.s3a : 0,
      s3b: typeof scores.s3b === 'number' ? scores.s3b : 0,
      s4: typeof scores.s4 === 'number' ? scores.s4 : 0,
      s5: typeof scores.s5 === 'number' ? scores.s5 : 0,
      s6: typeof scores.s6 === 'number' ? scores.s6 : 0,
      s7: typeof scores.s7 === 'number' ? scores.s7 : 0,
      s8: typeof scores.s8 === 'number' ? scores.s8 : 0,
    });
    hfsScore = calculatedScores.HFSv1 || -1;
  }
  
  return { 
    success: true,
    hfs_score: hfsScore,
    hfs_version: version,
    confidence: 1,
    // Don't set error field - it was causing the ingredient list to show in toast
    scores
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
        hfs_score: 0,
        confidence: 1 
    };
  }
  */
}