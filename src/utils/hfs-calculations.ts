/**
 * HFS (Health Food Score) calculation utilities
 * 
 * This module contains functions to calculate HFS v1 and v2 scores
 * from nutritional parameters and ingredient lists.
 */

/**
 * HFS v1 input arguments (per 100g)
 */
interface HFSV1Arguments {
  energy_kcal?: number; // Energy (kcal)
  carbs_total_g?: number; // Total carbohydrates (g)
  fiber_g?: number; // Fiber (g)
  sugars_added_g?: number; // Added sugar (g)
  saturated_fat_g?: number; // Saturated fat (g)
  trans_fat_g?: number; // Trans fat (g)
  total_fat_g?: number; // Total fat (g)
  sodium_mg?: number; // Sodium (mg)
  protein_g?: number; // Protein (g)
  sugars_total_g?: number; // Total sugars (g)
  n_ing?: number; // Number of ingredients
  serving_size_g?: number; // Portion size (g) - for reference, values should already be normalized to 100g
  density_g_ml?: number; // Density (g/ml), if liquid
  ABV_percentage?: number; // Alcohol by volume (%)
  NOVA?: number; // Processing level (1-4)
  is_liquid?: boolean; // True if density_g_ml is not null
}

/**
 * HFS v1 calculated scores
 */
interface HFSCalculatedScores {
  benefits?: number; // Aggregate benefits
  metabolic_risk?: number; // Metabolic risk
  behavioral_risk?: number; // Behavioral risk
  red_flag_risk?: number; // Red flag risk
  processing_risk?: number; // Processing risk (structural risk)
  raw_score?: number; // Raw score (before sigmoid)
  HFS?: number; // Final HFS score (0–100)
  HFS_version?: string; // HFS version string
}

/**
 * HFS v1 version constant
 */
const HFS_VERSION_V1 = "1.1";

/**
 * HFS v2 input arguments (per 100g)
 */
interface HFSV2Arguments {
  // Nutritional values (per 100g)
  fiber_g?: number; // Fiber (g)
  protein_g?: number; // Protein (g)
  carbs_total_g?: number; // Total carbohydrates (g)
  energy_kcal?: number; // Energy (kcal)
  fat_total_g?: number; // Total fat (g)
  saturated_fat_g?: number; // Saturated fat (g)
  trans_fat_g?: number; // Trans fat (g)
  sugars_added_g?: number; // Added sugars (g)
  sodium_mg?: number; // Sodium (mg)
  abv_percentage?: number; // Alcohol by volume (%)
  
  // Ingredients and processing
  ingredients_list?: string[]; // Ingredients list for additive detection
  declared_processes?: string; // Declared processes
  declared_special_nutrients?: string; // Declared special nutrients
  certifications?: string; // Certifications
  
  // Portion and location
  serving_size_value?: number; // Serving size value
  serving_size_unit?: string; // Serving size unit (g, ml, etc.)
  density?: number; // Density (g/ml)
  location?: string; // Location
}

/**
 * HFS v2 calculated scores
 */
interface HFSV2CalculatedScores {
  S_fiber?: number; // Fiber score
  protein_Raw?: number; // Raw protein score
  S_protein?: number; // Protein score
  low_net_carbs?: number; // Low net carbs score
  low_energy_density?: number; // Low energy density score
  hydration?: number; // Hydration factor
  whole_ingredients?: number; // Whole ingredients score
  B_nutr?: number; // Nutritional benefit score
  S_carbo_liquido?: number; // Net carbs score
  S_razao_carb_fibra?: number; // Carb/fiber ratio score
  S_gordura_trans?: number; // Trans fat score
  S_sodio?: number; // Sodium score
  S_densidade_energetica?: number; // Energy density score
  aditivos?: number; // Additives score
  HFS_version?: string; // HFS version string
}

/**
 * HFS v2 version constant
 */
const HFS_VERSION_V2 = "2.0";

/**
 * Saturation function (Michaelis–Menten kinetics).
 * Used in HFS v2 calculations: sat(x, k) = x / (x + k)
 * 
 * @param x - Input value
 * @param k - Saturation constant (half-maximum value)
 * @returns Saturation value between 0 and 1
 */
function sat(x: number, k: number): number {
  if (k === 0) {
    // If k is 0, return 1 if x > 0, 0 otherwise
    return x > 0 ? 1 : 0;
  }
  if (x < 0) {
    // Handle negative x values
    return 0;
  }
  return x / (x + k);
}

/**
 * Positional weight function.
 * Calculates the normalized weight for position j in a sequence of N positions.
 * Formula: w_pos(j, N) = e_pos(j) / Σ_{i=1..N} e_pos(i)
 * where e_pos(j) = exp(-0.25 * (j − 1))
 * 
 * @param j - Position index (1-based)
 * @param N - Total number of positions
 * @returns Normalized positional weight between 0 and 1
 */
function w_pos(j: number, N: number): number {
  if (N <= 0 || j < 1 || j > N) {
    return 0;
  }
  
  // Calculate e_pos(j) = exp(-0.25 * (j - 1))
  const e_pos_j = Math.exp(-0.25 * (j - 1));
  
  // Calculate sum of all e_pos(i) for i = 1 to N
  let sum = 0;
  for (let i = 1; i <= N; i++) {
    sum += Math.exp(-0.25 * (i - 1));
  }
  
  // Return normalized weight
  return sum > 0 ? e_pos_j / sum : 0;
}

/**
 * Sigmoid function.
 * Formula: sigmoid(z) = 1 / (1 + exp(-z))
 * 
 * @param z - Input value
 * @returns Sigmoid value between 0 and 1
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Calculates harmful additives contribution sum.
 * Searches for additives in ingredients list using regex patterns from additive_rules table.
 * 
 * @param ingredientsList - Array of ingredient strings to check
 * @returns Sum of contributions: Σ(weight * 0.80) for each detected additive
 */
async function calculateHarmfulAdditives(ingredientsList: string[]): Promise<number> {
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

    // Set to track unique additives detected (by name) to avoid double counting
    const detectedAdditives = new Set<string>();
    let somaContribuicoes = 0;
    
    // Check each ingredient against all additive rules
    for (const ingredient of ingredientsList) {
      if (!ingredient || typeof ingredient !== 'string') continue;
      
      const ingredientLower = ingredient.toLowerCase().trim();
      
      // Check each additive rule against this ingredient
      for (const rule of additiveRules) {
        if (!rule.regex || !rule.name || rule.weight === undefined) continue;
        
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
            // Calculate contribution: peso_aditivo * 0.80
            const contribuicao = rule.weight * 0.80;
            somaContribuicoes += contribuicao;
            // Continue checking other rules - one ingredient can contain multiple additives
          }
        } catch (e) {
          // Skip invalid regex patterns
          console.warn(`Invalid regex pattern for additive ${rule.name}:`, rule.regex, e);
        }
      }
    }
    
    return somaContribuicoes;
  } catch (error) {
    console.error('Error calculating harmful additives:', error);
    return 0;
  }
}

/**
 * Calculates HFS v1 scores from nutritional parameters.
 * All values are normalized to numbers (0 if undefined/null).
 * Results are rounded to 3 decimal places.
 * 
 * @param params - HFS v1 input parameters (per 100g)
 * @returns Calculated HFS v1 scores
 */
export function calculateHFSV1Scores(params: HFSV1Arguments): HFSCalculatedScores {
  // Normalize all values to numbers, defaulting to 0 if undefined or null
 
 
 
 
 
  const serving_size_g = typeof params.serving_size_g === 'number' && !isNaN(params.serving_size_g) ? params.serving_size_g : 100;
  const energy_kcal = typeof params.energy_kcal === 'number' && !isNaN(params.energy_kcal) ? params.energy_kcal : 0;
  const carbs_total_g = typeof params.carbs_total_g === 'number' && !isNaN(params.carbs_total_g) ? params.carbs_total_g : 0; 
  const sugars_total_g = typeof params.sugars_total_g === 'number' && !isNaN(params.sugars_total_g) ? params.sugars_total_g : 0;
  const sugars_added_g = typeof params.sugars_added_g === 'number' && !isNaN(params.sugars_added_g) ? params.sugars_added_g : 0;
  const sugars_natural_g = Math.max(0, sugars_total_g - sugars_added_g); // Natural sugars = total - added
  const fiber_g = typeof params.fiber_g === 'number' && !isNaN(params.fiber_g) ? params.fiber_g : 0;
  const total_fat_g = typeof params.total_fat_g === 'number' && !isNaN(params.total_fat_g) ? params.total_fat_g : 0;
  const saturated_fat_g = typeof params.saturated_fat_g === 'number' && !isNaN(params.saturated_fat_g) ? params.saturated_fat_g : 0;
  const trans_fat_g = typeof params.trans_fat_g === 'number' && !isNaN(params.trans_fat_g) ? params.trans_fat_g : 0;
  const protein_g = typeof params.protein_g === 'number' && !isNaN(params.protein_g) ? params.protein_g : 0;
  const sodium_mg = typeof params.sodium_mg === 'number' && !isNaN(params.sodium_mg) ? params.sodium_mg : 0;
  const NOVA = typeof params.NOVA === 'number' && !isNaN(params.NOVA) ? params.NOVA : 0;
  const n_ing = typeof params.n_ing === 'number' && !isNaN(params.n_ing) ? params.n_ing : 0;
  const ABV_percentage = typeof params.ABV_percentage === 'number' && !isNaN(params.ABV_percentage) ? params.ABV_percentage : 0;
  const density_g_ml = typeof params.density_g_ml === 'number' && !isNaN(params.density_g_ml) ? params.density_g_ml : undefined;

  
  // Derived flags and quantities
  const is_liquid = density_g_ml != null && density_g_ml > 0 ? 1 : 0;
  
  let serving_ml = 0;
  let energy_100ml = 0;
  let ethanol_g = 0;
  
  if (is_liquid === 1 && density_g_ml && density_g_ml > 0) {
    serving_ml = serving_size_g / density_g_ml;
    energy_100ml = serving_ml > 0 ? (energy_kcal * 100) / serving_ml : 0;
    ethanol_g = 0.789 * (ABV_percentage / 100) * serving_ml;
  }
  
  // net_carbs_g = max(0, carbs_total_g - fiber_g)
  const net_carbs_g = Math.max(0, carbs_total_g - fiber_g);
  
  // sodium_100g = sodium_mg * 100 / serving_size_g
  const sodium_100g = serving_size_g > 0 ? (sodium_mg * 100) / serving_size_g : sodium_mg;
  
  // Auxiliary variables
  // non_water_mass_g = carbs_total_g + protein_g + total_fat_g + fiber_g
  const non_water_mass_g = carbs_total_g + protein_g + total_fat_g + fiber_g;
  
  // water_eq_g = max(0, serving_size_g - non_water_mass_g)
  const water_eq_g = Math.max(0, serving_size_g - non_water_mass_g);
  
  // Helper functions
  const MAX = Math.max;
  
  // 6 Benefits block (benefits)
  // Fiber benefit
  // S_fiber = sat(fiber_g, 5)
  const S_fiber = sat(fiber_g, 5);
  
  // Protein benefit
  // S_protein = sat(protein_g, 10)
  const S_protein = sat(protein_g, 10);
  
  // Hydration benefit (water-equivalent mass, penalized by sugar and alcohol)
  // S_hydration = sat(water_eq_g, 140) * (1 - sat(net_carbs_g, 25)) * (1 - sat(ABV_percentage, 2))
  const S_hydration = sat(water_eq_g, 140) * (1 - sat(net_carbs_g, 25)) * (1 - sat(ABV_percentage, 2));
  
  // dose_relevance = sat(non_water_mass_g, 10)
  const dose_relevance = sat(non_water_mass_g, 10);
  
  // Aggregate benefits
  // benefits = dose_relevance * (0.40*S_fiber + 0.35*S_protein) + 0.25 * S_hydration
  const benefits = dose_relevance * (0.40 * S_fiber + 0.35 * S_protein) + 0.25 * S_hydration;

  // 7 Metabolic Risk
  // 7.1 Metabolic subcomponents (all range 0–1)
  
  // Energy load
  // S_energy = sat(energy_kcal, 300)
  const S_energy = sat(energy_kcal, 300);
  
  // Added sugar load
  // S_added_sugar = sat(sugars_added_g, 12)
  const S_added_sugar = sat(sugars_added_g, 12);
  
  // Carb–fiber ratio
  // S_carb_fiber_ratio = sat(carbs_total_g / (fiber_g + 1), 8)
  const S_carb_fiber_ratio = sat(carbs_total_g / (fiber_g + 1), 8);
  
  // Net carb load
  // S_net_carbs = sat(net_carbs_g, 20)
  const S_net_carbs = sat(net_carbs_g, 20);
  
  // Combined carbohydrate stress
  // S_carbs = max(S_added_sugar, 0.5 * S_carb_fiber_ratio, 0.3 * S_net_carbs)
  const S_carbs = MAX(
    S_added_sugar,
    0.5 * S_carb_fiber_ratio,
    0.3 * S_net_carbs
  );
  
  // Sodium load
  // S_sodium = sat(sodium_mg, 600)
  const S_sodium = sat(sodium_mg, 600);
  
  // Alcohol load
  // S_alcohol = sat(ethanol_g, 14)
  const S_alcohol = sat(ethanol_g, 14);
  
  // Fiber protection
  // S_fiber_protection = 0.25*sat(fiber_g, 5)
  const S_fiber_protection = 0.25 * sat(fiber_g, 5);
  
  // 7.2 Conditional saturated-fat logic
  
  // Indicators
  // I_fiber_low = 1 if fiber_g < 3 else 0
  const I_fiber_low = fiber_g < 3 ? 1 : 0;
  
  // I_ratio_high = 1 if (carbs_total_g / (fiber_g + 1)) > 8 else 0
  const I_ratio_high = (carbs_total_g / (fiber_g + 1)) > 8 ? 1 : 0;
  
  // I_nova_high = 1 if NOVA >= 3 else 0
  const I_nova_high = NOVA >= 3 ? 1 : 0;
  
  // Trigger count
  // trigger_count = I_fiber_low + I_ratio_high + I_nova_high
  const trigger_count = I_fiber_low + I_ratio_high + I_nova_high;
  
  // Trigger strength
  // S_trigger = sat(trigger_count, 1)
  const S_trigger = sat(trigger_count, 1);
  
  // Saturated fat (conditional)
  // S_saturated_fat = sat(saturated_fat_g, 8) * S_trigger
  const S_saturated_fat = sat(saturated_fat_g, 8) * S_trigger;
  
  // Trans fat
  // S_trans_fat = sat(trans_fat_g, 0.5)
  const S_trans_fat = sat(trans_fat_g, 0.5);
  
  // Combined fat stress
  // S_fat = 0.75 * S_saturated_fat + 0.25 * S_trans_fat
  const S_fat = 0.75 * S_saturated_fat + 0.25 * S_trans_fat;
  
  // 7.3 Aggregate metabolic risk
  // M_core = 1 - (1 - 0.28*S_energy) * (1 - 0.32*S_carbs) * (1 - 0.14*S_fat) * (1 - 0.14*S_sodium) * (1 - 0.18*S_alcohol)
  const M_core = 1 - (1 - 0.28 * S_energy) * (1 - 0.32 * S_carbs) * (1 - 0.14 * S_fat) * (1 - 0.14 * S_sodium) * (1 - 0.18 * S_alcohol);
  
  // metabolic_risk = M_core * (1 - S_fiber_protection)
  const metabolic_risk = M_core * (1 - S_fiber_protection);

  // 8 Processing Risk
  // Ingredient count risk
  // S_ingredients = sat(max(0, n_ing - 1), 10)
  const S_ingredients = sat(MAX(0, n_ing - 1), 10);
  
  // NOVA baseline
  // S_nova = sat((NOVA - 1) / 3, 0.60)
  const S_nova = sat((NOVA - 1) / 3, 0.60);
  
  // NOVA gated by formulation
  // S_nova_effective = S_nova * (0.25 + 0.75 * S_ingredients)
  const S_nova_effective = S_nova * (0.25 + 0.75 * S_ingredients);
  
  // Aggregate structural risk
  // processing_risk = 1 - (1 - 0.70*S_ingredients) * (1 - 0.30*S_nova_effective)
  const processing_risk = 1 - (1 - 0.70 * S_ingredients) * (1 - 0.30 * S_nova_effective);

  // 9 Behavioral Risk
  // Palatability / consumption-trap interaction
  // behavioral_risk = is_liquid * sat(max(0, net_carbs_g - 8), 8) * sat(sodium_100g, 300)
  const behavioral_risk = is_liquid * sat(MAX(0, net_carbs_g - 8), 8) * sat(sodium_100g, 300);

  // 10 Red-Flag Risk
  // Trans fat red flag
  // S_trans_fat = sat(trans_fat_g, 0.5)
  const S_trans_fat_red = sat(trans_fat_g, 0.5);
  
  // Saturated fat red flag
  // S_saturated_fat = sat(saturated_fat_g, 8)
  const S_saturated_fat_red = sat(saturated_fat_g, 8);
  
  // Sodium red flag
  // S_sodium = sat(sodium_mg, 1200)
  const S_sodium_red = sat(sodium_mg, 1200);
  
  // Added sugar red flag
  // S_added_sugar = sat(sugars_added_g, 25)
  const S_added_sugar_red = sat(sugars_added_g, 25);
  
  // Total sugar extreme flag
  // S_total_sugar = 0.30 * sat(sugars_total_g, 40)
  const S_total_sugar_red = 0.30 * sat(sugars_total_g, 40);
  
  // Alcohol red flag (high dose only)
  // S_alcohol = sat(ethanol_g, 28)
  const S_alcohol_red = sat(ethanol_g, 28);
  
  // Aggregate red-flag risk
  // red_flag_risk = max(S_trans_fat, S_saturated_fat, S_sodium, S_added_sugar, S_total_sugar, S_alcohol)
  const red_flag_risk = MAX(
    S_trans_fat_red,
    S_saturated_fat_red,
    S_sodium_red,
    S_added_sugar_red,
    S_total_sugar_red,
    S_alcohol_red
  );

  // 11 Final score
  // risk_core = 1 - (1 - 0.60*metabolic_risk) * (1 - 0.30*processing_risk) * (1 - 0.15*behavioral_risk)
  const risk_core = 1 - (1 - 0.60 * metabolic_risk) * (1 - 0.30 * processing_risk) * (1 - 0.15 * behavioral_risk);
  
  // total_risk = 1 - (1 - risk_core) * (1 - 0.50*red_flag_risk)
  const total_risk = 1 - (1 - risk_core) * (1 - 0.50 * red_flag_risk);
  
  // Water calibration constant
  // water_const = 0.174
  const water_const = 0.174;
  
  // Latent score
  // raw_score = 0.30 * benefits - 0.70 * total_risk + water_const
  const raw_score = 0.30 * benefits - 0.70 * total_risk + water_const;
  
  // Final HFS score (0–100)
  // HFS = 100 * sigmoid(4 * raw_score)
  const HFS = 100 * sigmoid(4 * raw_score);

  // Round all values to 3 decimal places
  const round3 = (value: number) => Math.round(value * 1000) / 1000;

  return {
    benefits: round3(benefits),
    metabolic_risk: round3(metabolic_risk),
    behavioral_risk: round3(behavioral_risk),
    red_flag_risk: round3(red_flag_risk),
    processing_risk: round3(processing_risk),
    raw_score: round3(raw_score),
    HFS: round3(HFS),
    HFS_version: HFS_VERSION_V1
  };
}

/**
 * Calculates HFS v2 scores from nutritional parameters.
 * Results are rounded to 3 decimal places.
 * 
 * @param params - HFS v2 input parameters (per 100g)
 * @returns Calculated HFS v2 scores
 */
export async function calculateHFSV2Scores(params: HFSV2Arguments): Promise<HFSV2CalculatedScores> {
  const {
    fiber_g = 0,
    protein_g = 0,
    carbs_total_g = 0,
    energy_kcal = 0,
    fat_total_g = 0,
    abv_percentage = 0,
    sugars_added_g = 0,
    trans_fat_g = 0,
    sodium_mg = 0,
    ingredients_list = []
  } = params;

  // net_carbs_g = total_carbs_g − fiber_g
  const net_carbs_g = carbs_total_g - fiber_g;

  // low_net_carbs = 1 − sat(net_carbs_g, 20)
  const low_net_carbs = 1 - sat(net_carbs_g, 20);

  // water_eq = max(0, 100 - (carbs+protein+fat+fiber))
  const water_eq = Math.max(0, 100 - (carbs_total_g + protein_g + fat_total_g + fiber_g));

  // S_fiber = sat(fiber_g, 5)
  const S_fiber = sat(fiber_g, 5);

  // protein_raw: use k = 12 if serving_size_value exists, otherwise k = 10
  const protein_k = params.serving_size_value ? 12 : 10;
  const protein_raw = sat(protein_g, protein_k);

  // low_energy_density = 1 − sat(kcal_per_100g, 250)
  const low_energy_density = 1 - sat(energy_kcal, 250);

  // hydration = sat(water_eq, 70) * (1 − sat(net_carbs_g, 25)) * (1 − sat(abv_percentage, 2))
  const hydration = sat(water_eq, 70) * (1 - sat(net_carbs_g, 25)) * (1 - sat(abv_percentage, 2));

  // 7.5 Ingredientes integrais
  // Calculate weight of whole ingredients (recognizable, not fractionated, extracted, or refined)
  let whole_weighted = 0;
  let matchResult: any = undefined; // Store matchResult for reuse in protein_factor calculation
  
  if (ingredients_list && ingredients_list.length > 0) {
    // Import matchIngredients dynamically to avoid circular dependencies
    const { matchIngredients } = await import('./ingredient-matcher');
    matchResult = matchIngredients(ingredients_list);
    const N = matchResult.results.length;
    
    if (N > 0) {
      for (let j = 0; j < N; j++) {
        const result = matchResult.results[j];
        // Get is_whole from the accepted candidate (decision.ingredient_id)
        let I_whole = 0;
        
        if (result.decision.ingredient_id !== undefined) {
          // Find the candidate with matching ingredient_id
          const acceptedCandidate = result.candidates.find(
            (c: any) => c.ingredient_id === result.decision.ingredient_id
          );
          
          if (acceptedCandidate && acceptedCandidate.is_whole !== undefined) {
            I_whole = acceptedCandidate.is_whole ? 1 : 0;
          }
        }
        
        // Calculate positional weight (j+1 because w_pos is 1-based)
        const weight = w_pos(j + 1, N);
        whole_weighted += weight * I_whole;
      }
    }
  }
  
  // whole_ingredients = S(whole_weighted, 0.5)
  const whole_ingredients = sat(whole_weighted, 0.5);

  // protein_factor calculation
  // Check for isolated/concentrated proteins in ingredients
  let protein_factor = 1.0;
  
  if (ingredients_list && ingredients_list.length > 0 && matchResult) {
    // Reuse matchResult from whole ingredients calculation
    const N_protein = matchResult.results.length;
    
    // Find isolated/concentrated proteins
    const isolatedProteinIndices: number[] = [];
    
    for (let j = 0; j < N_protein; j++) {
      const result = matchResult.results[j];
      
      if (result.decision.ingredient_id !== undefined) {
        // Find the candidate with matching ingredient_id
        const acceptedCandidate = result.candidates.find(
          (c: any) => c.ingredient_id === result.decision.ingredient_id
        );
        
        // Check if "concentrated_protein" is in the categories list
        if (acceptedCandidate && acceptedCandidate.categories && 
            Array.isArray(acceptedCandidate.categories) &&
            acceptedCandidate.categories.includes('concentrated_protein')) {
          isolatedProteinIndices.push(j);
        }
      }
    }
    
    // Calculate sum of positional weights for isolated proteins
    if (isolatedProteinIndices.length > 0) {
      let sum_w_pos_isolated = 0;
      for (const j_isolado of isolatedProteinIndices) {
        sum_w_pos_isolated += w_pos(j_isolado + 1, N_protein); // j+1 because w_pos is 1-based
      }
      
      // protein_factor = 1.0 - min(0.5, Σ w_pos(j_isolado))
      protein_factor = 1.0 - Math.min(0.5, sum_w_pos_isolated);
    }
  }

  // S_protein = protein_raw * protein_factor
  const S_protein = protein_raw * protein_factor;
  const B_nutr =
    0.27 * S_fiber +
    0.23 * S_protein +
    0.18 * low_net_carbs +
    0.12 * low_energy_density +
    0.10 * whole_ingredients +
    0.10 * hydration;

  // Buscar aditivos na lista de ingredientes e calcular soma de contribuições
  const somaContribuicoes = await calculateHarmfulAdditives(ingredients_list);

  // Round all values to 3 decimal places
  const round3 = (value: number) => Math.round(value * 1000) / 1000;

  // Prepare return object
  const result = {
    S_fiber: round3(S_fiber),
    protein_Raw: round3(protein_raw),
    S_protein: round3(S_protein), // S_protein = protein_raw * protein_factor
    low_net_carbs: round3(low_net_carbs),
    low_energy_density: round3(low_energy_density),
    hydration: round3(hydration),
    whole_ingredients: round3(whole_ingredients),
    B_nutr: round3(B_nutr),
    HFS_version: HFS_VERSION_V2
  };

  // Print JSON to terminal
  console.log(JSON.stringify(result, null, 2));

  return result;
}

