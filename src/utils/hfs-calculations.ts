/**
 * Calculate HFS score components from raw parameters
 */

interface HFSParameters {
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
}

interface HFSCalculatedScores {
  S1?: number;
  S2?: number;
  s3?: number;
  S3?: number;
  S4?: number;
  S5?: number;
  S6?: number;
  S7?: number;
  S8?: number;
  N?: number;
  M?: number;
  P?: number;
  R?: number;
  HFSv1?: number;
}

interface HFSV2Parameters {
  fiber_g?: number; // Fibra (g)
  protein_g?: number; // Proteína (g)
  carbs_total_g?: number; // Carboidratos totais (g)
  energy_kcal?: number; // Energia (kcal)
  fat_total_g?: number; // Gordura total (g)
  abv_percentage?: number; // ABV (%)
  sugars_added_g?: number; // Açúcares adicionados (g)
  trans_fat_g?: number; // Gordura trans (g)
  sodium_mg?: number; // Sódio (mg)
  ingredients_list?: string[]; // Lista de ingredientes para buscar aditivos
}

interface HFSV2CalculatedScores {
  fibra?: number;
  proteina_bruta?: number;
  proteina?: number;
  baixo_carbo_liquido?: number;
  baixa_densidade?: number;
  F_hidratacao?: number;
  S_carbo_liquido?: number;
  S_razao_carb_fibra?: number;
  S_gordura_trans?: number;
  S_sodio?: number;
  S_densidade_energetica?: number;
  aditivos?: number;
}

/**
 * Saturation function (Michaelis–Menten): S(x, k) = x / (x + k)
 */
function S(x: number, k: number): number {
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
 * Calculate harmful additives contribution sum
 * Searches for additives in ingredients list using regex from additive_rules table
 * Returns sum of contributions: sum(weight * 0.80) for each detected additive
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

export function calculateHFSScores(params: HFSParameters): HFSCalculatedScores {
  // Ensure all values are numbers, defaulting to 0 if undefined or null
  const s1a = typeof params.s1a === 'number' && !isNaN(params.s1a) ? params.s1a : 0;
  const s1b = typeof params.s1b === 'number' && !isNaN(params.s1b) ? params.s1b : 0;
  const s2 = typeof params.s2 === 'number' && !isNaN(params.s2) ? params.s2 : 0;
  const s3a = typeof params.s3a === 'number' && !isNaN(params.s3a) ? params.s3a : 0;
  const s3b = typeof params.s3b === 'number' && !isNaN(params.s3b) ? params.s3b : 0;
  const s4 = typeof params.s4 === 'number' && !isNaN(params.s4) ? params.s4 : 0;
  const s5 = typeof params.s5 === 'number' && !isNaN(params.s5) ? params.s5 : 0;
  const s6 = typeof params.s6 === 'number' && !isNaN(params.s6) ? params.s6 : 0;
  const s7 = typeof params.s7 === 'number' && !isNaN(params.s7) ? params.s7 : 0;
  const s8 = typeof params.s8 === 'number' && !isNaN(params.s8) ? params.s8 : 0;

  // Helper functions
  const MAX = Math.max;
  const MIN = Math.min;
  const EXP = Math.exp;

  // S1 = MAX(MIN(100-4*s1a-2.5*MAX(s1a+s1b-s2,0)-4*MAX((s1a+s1b)/MAX(MIN(s2, 4), 0.5)-4,0),100),0)
  // Breaking down the formula for clarity and correctness:
  const totalSugars = s1a + s1b;
  const fiberAdjusted = MAX(MIN(s2, 4), 0.5);
  const sugarFiberDiff = MAX(totalSugars - s2, 0);
  const sugarFiberRatio = totalSugars / fiberAdjusted;
  const ratioPenalty = MAX(sugarFiberRatio - 4, 0);
  
  const S1Value = 100 - (4 * s1a) - (2.5 * sugarFiberDiff) - (4 * ratioPenalty);
  const S1 = MAX(MIN(S1Value, 100), 0);

  // S2 = MIN(100*(s2/8)^0.454,100)
  const S2 = s2 > 0 ? MIN(100 * Math.pow(s2 / 8, 0.454), 100) : 0;

  // s3 = sat + 10 * trans
  const s3 = s3a + 10 * s3b;

  // S3 = MAX(100-2*s3/(1+0.5*MIN(s2/8, 0.75)),0)
  const S3 = MAX(100 - 2 * s3 / (1 + 0.5 * MIN(s2 / 8, 0.75)), 0);

  // S4 = (0.6+0.4*(MIN(1,s2/8)))*100 / (1 + (s4/250)^1.3)
  const S4 = ((0.6 + 0.4 * MIN(1, s2 / 8)) * 100) / (1 + Math.pow(s4 / 250, 1.3));

  // S5 = MIN(100*(1-EXP(-s5/8)), 100)
  const S5 = MIN(100 * (1 - EXP(-s5 / 8)), 100);

  // S6 = MIN(MAX(113.85-0.1154*s6, 0), 100)
  const S6 = MIN(MAX(113.85 - 0.1154 * s6, 0), 100);

  // S7: Map NOVA (s7) to S7 score
  // s7=1 → S7 = 100
  // s7=2 → S7 = 85
  // s7=3 → S7 = 60
  // s7=4 → S7 = 25
  let S7: number | undefined = undefined;
  if (s7 >= 1 && s7 <= 4) {
    const s7Map: { [key: number]: number } = {
      1: 100,
      2: 85,
      3: 60,
      4: 25
    };
    S7 = s7Map[Math.round(s7)];
  }

  // S8 = MAX(0, 100-12*MIN(COUNT(s8),6))
  const S8 = MAX(0, 100 - 12 * MIN(s8, 6));

  // N = (20S1+15S2+20S3+15S4+10S5+10S6)/90
  const N = (20 * S1 + 15 * S2 + 20 * S3 + 15 * S4 + 10 * S5 + 10 * S6) / 90;

  // M = MIN(MAX(100-0.25*s4-2.5*s1a-0.02*s6,0),100)
  const M = MIN(MAX(100 - 0.25 * s4 - 2.5 * s1a - 0.02 * s6, 0), 100);

  // P = (0.85 + 0.15*min(S1,S3,S4,S6)/100)
  const P = 0.85 + 0.15 * MIN(S1, S3, S4, S6) / 100;

  // R = 0.7 + 0.3 * (0.7*S7 + 0.3*S8)/100
  const R = 0.7 + 0.3 * ((0.7 * (S7 || 0) + 0.3 * S8) / 100);

  // HFSv1.0 = 0.6*M*P*R+0.4*N
  const HFSv1 = 0.6 * M * P * R + 0.4 * N;

  // Round all values to 3 decimal places
  const round3 = (value: number) => Math.round(value * 1000) / 1000;

  return {
    S1: round3(S1),
    S2: round3(S2),
    s3: round3(s3),
    S3: round3(S3),
    S4: round3(S4),
    S5: round3(S5),
    S6: round3(S6),
    S7: S7 !== undefined ? round3(S7) : undefined,
    S8: round3(S8),
    N: round3(N),
    M: round3(M),
    P: round3(P),
    R: round3(R),
    HFSv1: round3(HFSv1)
  };
}

/**
 * Calculate HFS v2 scores from raw parameters
 */
export async function calculateHFSV2Scores(params: HFSV2Parameters): Promise<HFSV2CalculatedScores> {
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

  // Fibra: S(gramas_fibra, 5)
  const fibra = S(fiber_g, 5);

  // Proteína bruta: S(gramas_proteina, 10)
  const proteina_bruta = S(protein_g, 10);

  // Proteína: proteina_bruta * 1
  const proteina = proteina_bruta * 1;

  // Baixo carboidrato líquido: 1 - S(carbo_liquido, 20)
  // onde carbo_liquido = carbo_total - fibra
  const carbo_liquido = carbs_total_g - fiber_g;
  const baixo_carbo_liquido = 1 - S(carbo_liquido, 20);

  // Baixa densidade energética: 1 - S(kcal, 250)
  const baixa_densidade = 1 - S(energy_kcal, 250);

  // Hidratação
  // massa_nao_agua = carbo_total + proteina + gordura_total + fibra
  const massa_nao_agua = carbs_total_g + protein_g + fat_total_g + fiber_g;
  // agua_eq = max(0, 100 − massa_nao_agua)
  const agua_eq = Math.max(0, 100 - massa_nao_agua);
  // F_hidratacao = S(agua_eq, 70) * (1 - S(carb_liq, 25)) * (1 - S(ABV, 2))
  const F_hidratacao = S(agua_eq, 70) * (1 - S(carbo_liquido, 25)) * (1 - S(abv_percentage, 2));

  // Novos scores
  // S_carbo_liquido = S(carbo_liquido + 0.5 * acucar_add, 25)
  const S_carbo_liquido = S(carbo_liquido + 0.5 * sugars_added_g, 25);

  // S_razao_carb_fibra = S(carbo_total / max(fibra,1), 8)
  const S_razao_carb_fibra = S(carbs_total_g / Math.max(fiber_g, 1), 8);

  // S_gordura_trans = S(gordura_trans, 0.10)
  const S_gordura_trans = S(trans_fat_g, 0.10);

  // S_sodio = S(sodio_mg, 400)
  const S_sodio = S(sodium_mg, 400);

  // S_densidade_energetica = S(kcal, 350)
  const S_densidade_energetica = S(energy_kcal, 350);

  // Aditivos prejudiciais
  // Buscar aditivos na lista de ingredientes e calcular soma de contribuições
  const somaContribuicoes = await calculateHarmfulAdditives(ingredients_list);
  // aditivos = S(soma_contribuicoes, 0.25)
  const aditivos = S(somaContribuicoes, 0.25);

  // Round all values to 3 decimal places
  const round3 = (value: number) => Math.round(value * 1000) / 1000;

  return {
    fibra: round3(fibra),
    proteina_bruta: round3(proteina_bruta),
    proteina: round3(proteina),
    baixo_carbo_liquido: round3(baixo_carbo_liquido),
    baixa_densidade: round3(baixa_densidade),
    F_hidratacao: round3(F_hidratacao),
    S_carbo_liquido: round3(S_carbo_liquido),
    S_razao_carb_fibra: round3(S_razao_carb_fibra),
    S_gordura_trans: round3(S_gordura_trans),
    S_sodio: round3(S_sodio),
    S_densidade_energetica: round3(S_densidade_energetica),
    aditivos: round3(aditivos)
  };
}

